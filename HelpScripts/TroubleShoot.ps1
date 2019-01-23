###############################################################################################################
#                                          Start config section
###############################################################################################################

# F5 Device to diagnose
# Use DNS or else the TLS/SSL tests will fail
$Device = ""

###############################################################################################################
#                                           End config section
###############################################################################################################

# Accept self signed X509Certificates
add-type @"
        using System.Net;
        using System.Security.Cryptography.X509Certificates;
        public class TrustAllCertsPolicy : ICertificatePolicy {
            public bool CheckValidationResult(
                ServicePoint srvPoint, X509Certificate certificate,
                WebRequest request, int certificateProblem) {
                return true;
            }
        }
"@

Function Test-F5Connectivity {
    Param($Device)

    $Result = Test-NetConnection 192.168.70.117 -Port 443

    If($Result.TcpTestSucceeded){
        Write-Host "Network connectivity: " -NoNewLine; Write-Host "Successful" -ForegroundColor Green 
    } Else {
        Write-Host "Network connectivity: " -NoNewLine; Write-Host "Failed" -ForegroundColor Red
    }

    if($Result.TcpTestSucceeded){
        [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Ssl3, [Net.SecurityProtocolType]::Tls, [Net.SecurityProtocolType]::Tls11, [Net.SecurityProtocolType]::Tls12

        Try {
            $Response = Invoke-WebRequest https://192.168.70.117/tmui/login.jsp?
            If($Response.StatusCode -eq 200){
                Write-Host "HTTP Connectivity: " -NoNewLine; Write-Host "Successful" -ForegroundColor Green
            } Else {
                Write-Host "HTTP Connectivity: " -NoNewLine; Write-Host $("Failed, got " + $Response.StatusCode) -ForegroundColor Red
            }
            If($Response.Headers.ContainsKey("F5-Login-Page")){
                Write-Host "F5 Login Page: " -NoNewLine; Write-Host "Successful" -ForegroundColor Green
            } Else {
                Write-Host "F5 Login Page: " -NoNewLine; Write-Host "Failed" -ForegroundColor Red
            }
        } Catch {
            Write-Host "HTTP Connectivity: "; Write-Host "Failed" -ForegroundColor Red
        }
    }
}

# Taken from:
# https://www.sysadmins.lv/blog-en/test-web-server-ssltls-protocol-support-with-powershell.aspx
function Test-ServerSSLSupport {
[CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$HostName,
        [UInt16]$Port = 443
    )
    process {
        $RetValue = New-Object psobject -Property @{
            Host = $HostName
            Port = $Port
            SSLv2 = $false
            SSLv3 = $false
            TLSv1_0 = $false
            TLSv1_1 = $false
            TLSv1_2 = $false
            KeyExhange = $null
            HashAlgorithm = $null
        }
        "ssl2", "ssl3", "tls", "tls11", "tls12" | %{
            $TcpClient = New-Object Net.Sockets.TcpClient
            $TcpClient.Connect($RetValue.Host, $RetValue.Port)
            $SslStream = New-Object Net.Security.SslStream $TcpClient.GetStream()
            $SslStream.ReadTimeout = 15000
            $SslStream.WriteTimeout = 15000
            try {
                $SslStream.AuthenticateAsClient($RetValue.Host,$null,$_,$false)
                $RetValue.KeyExhange = $SslStream.KeyExchangeAlgorithm
                $RetValue.HashAlgorithm = $SslStream.HashAlgorithm
                $status = $true
            } catch {
                $status = $false
            }
            switch ($_) {
                "ssl2" {$RetValue.SSLv2 = $status}
                "ssl3" {$RetValue.SSLv3 = $status}
                "tls" {$RetValue.TLSv1_0 = $status}
                "tls11" {$RetValue.TLSv1_1 = $status}
                "tls12" {$RetValue.TLSv1_2 = $status}
            }
            # dispose objects to prevent memory leaks
            $TcpClient.Dispose()
            $SslStream.Dispose()
        }
        $RetValue
    }
}

Function Test-PSVersion {
    If($PSVersionTable.PSVersion.Major -ge 5){
        Write-Host "Powershell major version: " -NoNewLine; Write-Host $($PSVersionTable.PSVersion.Major) -ForegroundColor Green
    } Else {
        Write-Host "Powershell major version: " -NoNewLine; Write-Host $($PSVersionTable.PSVersion.Major) -ForegroundColor Red
    }
}

"Testing connectivity"
Test-F5Connectivity $Device

if($Device -Match '^[0-9\.]+$'){
    Write-Host "Device IP was used instead of device FQDN, skipping cipher tests" -ForegroundColor "Red" 
} Else {
    "Supported ciphers"
    $Ciphers = Test-ServerSSLSupport $Device
    $Ciphers
}