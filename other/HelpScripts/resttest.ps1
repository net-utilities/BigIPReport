#! /usr/bin/pwsh
#Requires -Version 6

Param(
    $Device,
    $userpass
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Error.Clear()

Function Get-AuthToken {
    Param($Device,$userpass)

    #Encode the string to base64
    $EncodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($userpass))

    #Add the "Basic prefix"
    $BasicAuthValue = "Basic $EncodedCreds"

    #Prepare the headers
    $Headers = @{
        "Authorization" = $BasicAuthValue
        "Content-Type" = "application/json"
    }

    #Create the body of the post
    $Body = @{"username" = $userpass.split(":")[0]; "password" = $userpass.split(":")[1]; "loginProviderName" = "tmos" }

    #Convert the body to Json
    $Body = $Body | ConvertTo-Json

    try {
        $Response = ""
        $Response  = Invoke-RestMethod -Method "POST" -Headers $Headers -Body $Body -Uri "https://$Device/mgmt/shared/authn/login"
    } catch {
        Write-Host "Could not login as $userpass to $Device : $Response"
        return $null
    }

    if ($Response.token.token) {
        $Headers = @{ "X-F5-Auth-Token" = $Response.token.token; }
        return $Headers
    } else {
        return $null
    }
}

$Headers = Get-AuthToken $Device $userpass
if (-not ($Headers)) {
    exit
}
$Response1 = Invoke-RestMethod -Headers $Headers -Uri "https://$Device/mgmt/tm/ltm/pool/members/stats?`$filter=partition"

Foreach($PoolStat in $Response1.entries.psobject.properties.Value) {
    Write-Host "Pool:" $PoolStat.nestedStats.entries.tmName.description
    Foreach($PoolMemberStat in $PoolStat.nestedStats.entries.psobject.Properties.Value.nestedStats.entries.psobject.Properties.Value) {
        Write-Host "Member:" $PoolMemberStat.nestedStats.entries.nodeName.description
    }
}

$Response2 = Invoke-WebRequest -Headers $Headers -Uri "https://$Device/mgmt/tm/ltm/pool/members/stats?`$filter=partition" |
        ConvertFrom-Json -AsHashtable

Foreach($PoolStat in $Response2.entries.Values) {
    Write-Host "Pool:" $PoolStat.nestedStats.entries.tmName.description
    Foreach($PoolMemberStat in $PoolStat.nestedStats.entries.Values.nestedStats.entries.Values) {
        Write-Host "Member:" $PoolMemberStat.nestedStats.Values.nodeName.description
    }
}