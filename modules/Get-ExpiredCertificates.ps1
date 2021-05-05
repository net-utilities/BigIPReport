Function Get-ExpiredCertificates {
    Param($Devices, $State, $AlertConfig, $SlackWebHook)

    # Check if any Alert Transport has been enabled, return if not
    if ( -not ($AlertConfig.SlackEnabled.Trim() -eq "True") ) {
        log "info" "No certificate alerting channel has been enabled"
        Return @{}
    }

    # Get the old state if it exists, otherwise create a new one
    if ($State.ContainsKey("certificateAlerts")) {
        $CertificateAlerts = $State["certificateAlerts"]
    } else {
        $CertificateAlerts = @{}
    }

    log info "Checking for expired certificates"

    $WaitHoursBetween = [int]$AlertConfig.WaitHoursBetween
    $WaitSecondsBetween = $WaitHoursBetween * 3600
    $AlertWhenDaysOld = [int]$AlertConfig.AlertWhenDaysToExpiration
    $AlertWhenSecondsOld = $AlertWhenDaysOld * 3600 * 24

    # Get current epoch date
    $Now = ([math]::Floor((Get-Date -UFormat %s)));

    Foreach($DeviceName in $Devices.Keys){
        $Device = $Devices[$DeviceName]

        # Make sure that the device has certificates (passive ones does not)
        if ($Device.ContainsKey('Certificates')) {

            Foreach($CertificateName in $Device.Certificates.Keys) {

                $Certificate = $Device.Certificates[$CertificateName]
                $AlertKey = $Certificate.loadbalancer + $Certificate.fileName

                $HasExistingAlert = $CertificateAlerts.ContainsKey($AlertKey)
                $ExpiresWithinAlertPeriod = ($Certificate.expirationDate - $Now) -lt $AlertWhenSecondsOld

                # Remove alerts for valid certificates
                if (-not $ExpiresWithinAlertPeriod -and $HasExistingAlert) {
                    log "verbose" "Cleaning alert for $AlertKey now within configured time frame of $AlertWhenDaysOld"
                    $CertificateAlerts.Remove($AlertKey)
                    Continue
                }

                # Certificate does not expire within the configured alert period
                if (-not $ExpiresWithinAlertPeriod) {
                    Continue
                }

                if ($HasExistingAlert) {
                    $CertificateAlert = $CertificateAlerts[$AlertKey]
                } else {
                    $CertificateAlert = @{
                        fileName = $Certificate.fileName;
                        loadbalancer = $Certificate.loadbalancer;
                        commonName = $Certificate.subject.commonName;
                        lastAlerted = 0;
                        key = $AlertKey;
                        expiresInDays = $([math]::Floor(($Certificate.expirationDate - $Now)/(3600*24)))
                    }
                }

                $CertificateAlerts[$AlertKey] = $CertificateAlert
            }
        }
    }

    $AlertsToSend = $CertificateAlerts.Values | Where-Object { ($Now - $_.lastAlerted) -gt $WaitSecondsBetween }

    if ($null -ne $AlertsToSend -and $SlackWebHook -ne "") {
        . .\modules\Send-SlackCertificateAlert.ps1
        Send-SlackCertificateAlert -AlertsToSend $AlertsToSend -AlertWhenDaysOld $AlertWhenDaysOld
        if($?){
            ForEach($SentAlert in $AlertsToSend){
                $CertificateAlerts[$SentAlert.key].lastAlerted = $Now
            }
        }
    }

    Return $CertificateAlerts
}
