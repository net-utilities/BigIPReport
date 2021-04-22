Function GenerateCertificateAlerts {
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
                    log "verbose" "Cleaning old certificate alert for $AlertKey which is now expiring within the configured time frame of $AlertWhenDaysOld"
                    $CertificateAlerts.Remove($AlertKey)
                    Continue
                }
                
                # Certificate does not expire within the configured alert period
                if (-not $ExpiresWithinAlertPeriod) {
                    log "verbose" "Certificate $AlertKey does not expire within the configured time frame ($AlertWhenDaysOld days)"
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

                # Expired certificate has an existing alert, either update the time stamp and alert or configure not to alert
                if (($Now - $CertificateAlert.lastAlerted) -gt $WaitSecondsBetween){
                    log verbose "Adding certificate $AlertKey to the alert list"
                    $CertificateAlert.lastAlerted = $Now
                } else {
                    log verbose "Last alert sent within $WaitHoursBetween hours, skipping sending alert"
                }
                $CertificateAlerts[$AlertKey] = $CertificateAlert
            }
        }
    }

    $AlertsToSend = $CertificateAlerts.Values | Where-Object { $_.lastAlerted -eq $Now }
    
    if ($null -ne $AlertsToSend) {
        . .\data-collector-modules\SlackAlerts\Send-SlackCertificateAlert.ps1
        Send-SlackCertificateAlert -AlertsToSend $AlertsToSend -AlertWhenDaysOld $AlertWhenDaysOld
    }

    Return $CertificateAlerts

}