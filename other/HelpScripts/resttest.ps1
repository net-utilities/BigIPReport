#! /usr/bin/env pwsh
#Requires -Version 6

# resttest.ps1 <f5name> <username:password>

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

    $Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $Response = ""
    try {
        #Write-Host "Try with BasicAuthValue=$BasicAuthValue Body=$Body"
        $Response = Invoke-RestMethod -WebSession $Session -Headers $Headers -Method "POST" -Body $Body -Uri "https://$Device/mgmt/shared/authn/login"
    } catch {
        Write-Host "Could not login as $userpass to $Device : $Response"
        return $null
    }

    if ($Response.token.token) {
        return $Session
    } else {
        return $null
    }
}

$Session = Get-AuthToken $Device $userpass
if (-not ($Session)) {
    exit
}

$Response2 = Invoke-WebRequest -WebSession $Session -Uri "https://$Device/mgmt/tm/ltm/pool/members/stats?`$filter=partition" |
        ConvertFrom-Json -AsHashtable

Foreach($PoolStat in $Response2.entries.Values) {
    Write-Host "Pool:" $PoolStat.nestedStats.entries.tmName.description
    $search = 'https://localhost/mgmt/tm/ltm/pool/members/' + $PoolStat.nestedStats.entries.tmName.description.replace("/", "~") + '/members/stats'
    Foreach($PoolMemberStat in $PoolStat.nestedStats.entries.$search.nestedStats.entries.Values) {
        Write-Host "Member:" $PoolMemberStat.nestedStats.entries.nodeName.description $PoolMemberStat.nestedStats.entries.port.value
    }
}