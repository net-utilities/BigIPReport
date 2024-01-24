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

    $Response = ""
    try {
        #Write-Host "Try with BasicAuthValue=$BasicAuthValue Body=$Body"
        $Response = Invoke-RestMethod -WebSession $Session -Headers $Headers -Method "POST" -Body $Body -Uri "https://$Device/mgmt/shared/authn/login"

        if ($Response.token.token) {
          $Session.Headers.Add('X-F5-Auth-Token', $Response.token.token)
          $null = $Session.Headers.Remove('Authorization')
        }
      } catch {
        Write-Host "Could not login as $userpass to $Device : $Response"
        exit
    }
}

$Session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Get-AuthToken $Device $userpass

$Response2 = Invoke-WebRequest -WebSession $Session -Uri "https://$Device/mgmt/tm/sys/global-settings" | ConvertFrom-Json -AsHashtable
"Hostname is: " + $Response2.hostname

$null = Invoke-WebRequest -WebSession $Session -Method "DELETE" -Uri ("https://$Device/mgmt/shared/authz/tokens/" + $Session.Headers["X-F5-Auth-Token"]) | ConvertFrom-Json -AsHashtable

