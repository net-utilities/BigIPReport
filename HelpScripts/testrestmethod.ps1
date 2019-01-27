#! /usr/bin/pwsh

#    Load the configration file
Param($ConfigurationFile = "$PSScriptRoot/bigipreportconfig.xml")

#Check if the configuration file exists
if(Test-Path $ConfigurationFile){
    #Read the file as xml
    [xml]$Global:Bigipreportconfig = Get-Content $ConfigurationFile

    #Verify that the file was succssfully loaded, otherwise exit
    if($?){
        $Outputlevel = $Global:Bigipreportconfig.Settings.Outputlevel
        if($Outputlevel -eq "Verbose"){
            "Successfully loaded the config file: $ConfigurationFile"
        }
    } else {
        Write-Error "Can't read the config file: $ConfigurationFile, or config file corrupt. Aborting."
        Exit
    }
} else {
    Write-Error "Failed to load config file $ConfigurationFile from $PSScriptRoot. Aborting."
    Exit
}

$User = $Global:Bigipreportconfig.Settings.Credentials.Username
$Password = $Global:Bigipreportconfig.Settings.Credentials.Password

#Create the string that is converted to Base64
$Credentials = $Global:Bigipreportconfig.Settings.Credentials.Username + ":" + $Global:Bigipreportconfig.Settings.Credentials.Password

#Encode the string to base64
$EncodedCreds = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($Credentials))

#Add the "Basic prefix"
$BasicAuthValue = "Basic $EncodedCreds"

#Prepare the headers
$Global:Headers = @{
    "Authorization" = $BasicAuthValue
}

function F5 {
    Param($server, $uri, $method);

[xml]$Body=@"
<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope
    xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <SOAP-ENV:Body>
        <jsx1:$method
            xmlns:jsx1="urn:iControl:$uri"/>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
"@
#        <virtual_servers type="ns2:Array" ns2:arrayType="xsd:string[300]">
#            <item xsi:type="xsd:string">VSchem16001</item>
#        </virtual_servers>
#<virtual_servers soapenc:arrayType="xsd:string[ 1 ]" xsi:type="soapenc:Array">
#s:type="A:Array" A:arrayType="y:string[48]"
#            <item xsi:type="xsd:string">VSchem16001</item>
#        </virtual_servers>

    $URI="https://${server}/iControl/iControlPortal.cgi"
    $response = Invoke-RestMethod -URI $URI –ContentType "text/xml" -Headers $Global:Headers –Method POST -Body $Body
    $response.InnerXml | Out-Host

    $retval = @($response.SelectNodes("//item").InnerText)
    if ($null -eq $retval[0]) {
        $retval = $($response.SelectNodes("//return").InnerText)
    }

    return $retval
}

function WriteXmlToScreen ([xml]$xml)
{
    $StringWriter = New-Object System.IO.StringWriter;
    $XmlWriter = New-Object System.Xml.XmlTextWriter $StringWriter;
    $XmlWriter.Formatting = "indented";
    $xml.WriteTo($XmlWriter);
    $XmlWriter.Flush();
    $StringWriter.Flush();
    Write-Output $StringWriter.ToString();
}

$Server = $Global:Bigipreportconfig.Settings.DeviceGroups.DeviceGroup[0].Device[0]

$VersionInformation = F5 -server $Server -uri "System/SoftwareManagement" -method "get_all_software_status"
$VersionInformation | ConvertTo-Json
break
"Virtual Servers"
$VirtualServers = F5 -server $Server -uri "LocalLB/VirtualServer" -method "get_list" | Sort-Object
$VSXML = $VirtualServers | ConvertTo-Xml
WriteXmlToScreen $VSXML
"Pools"
$Poollist = F5 -server $Server -uri "LocalLB/Pool" -method "get_list" | Sort-Object
$Poollist | ConvertTo-Json
"hostname"
$BigIPHostname = F5 -server $Server -uri "System/Inet" -method "get_hostname"
$BigIPHostname | ConvertTo-Json
"profiles"
$VirtualServerProfiles = F5 -server $Server -uri "LocalLB/VirtualServer" -method "get_profile" -param $VirtualServers
