Function Get-FailedDeviceAlerts {
    Param($Devices, $State, $AlertConfig, $SlackWebHook)

    # Check if any Alert Transport has been enabled, return if not
    if ( -not ($AlertConfig.SlackEnabled.Trim() -eq "True") ) {
        log "info" "No failed devices alerting channel has been enabled"
        Return @{}
    }

    # Get the old state if it exists, otherwise create a new one
    if ($State.ContainsKey("failedDevices")) {
        $FailedDeviceAlerts = $State["failedDevices"]
    } else {
        $FailedDeviceAlerts = @{}
    }

    log info "Checking for devices that were not indexed successfully"

    $WaitHoursBetween = [int]$AlertConfig.WaitHoursBetween
    $WaitSecondsBetween = $WaitHoursBetween * 3600
    $AlertAfterFailures = [int]$AlertConfig.AlertAfterFailures

    # Get current epoch date
    $Now = ([math]::Floor((Get-Date -UFormat %s)));

    Foreach($DeviceName in $Devices.Keys){
        $Device = $Devices[$DeviceName].LoadBalancer

        $HasExistingAlert = $FailedDeviceAlerts.ContainsKey($DeviceName)

        # Clear old alerts for successful load balancers
        if ($Device.success){
            if($HasExistingAlert){
                log verbose "Clearing failed device alert for $DeviceName"
                $FailedDeviceAlerts.Remove($DeviceName)
            }
            Continue
        }

        if ($HasExistingAlert) {
            log verbose "Alert exists, increasing fail count for $DeviceName"
            $DeviceAlert = $FailedDeviceAlerts[$DeviceName]
            $FailedDeviceAlerts[$DeviceName]["numberOfTimesFailed"]++;
        } else {
            $DeviceAlert = @{
                name = $DeviceName
                numberOfTimesFailed = 1
                lastAlerted = 0;
            }
        }
        $FailedDeviceAlerts[$DeviceName] = $DeviceAlert
    }

    $AlertsToSend = $FailedDeviceAlerts.Values | Where-Object { ($Now - $_.lastAlerted) -gt $WaitSecondsBetween -and $_.numberOfTimesFailed -ge $AlertAfterFailures }

    if ($null -ne $AlertsToSend -and $SlackWebHook -ne "") {
        . modules/Send-SlackFailedDeviceAlert.ps1
        Send-SlackFailedDeviceAlert -AlertsToSend $AlertsToSend
        if($?){
            Foreach($SentAlert in $AlertsToSend){
                $FailedDeviceAlerts[$SentAlert.name].lastAlerted = $Now
            }
        }
    }

    Return $FailedDeviceAlerts

}
