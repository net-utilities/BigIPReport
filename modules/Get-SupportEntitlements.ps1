Function Get-SupportEntitlements {

    Param($Devices, $State, $SupportCheckConfig, $AlertConfig, $SlackWebHook)

    $WaitHoursBetween = [int]$AlertConfig.WaitHoursBetween
    $WaitSecondsBetween = $WaitHoursBetween * 3600
    $Now = ([math]::Floor((Get-Date -UFormat %s)))

    if($Global:Bigipreportconfig.Settings.SupportCheck -and $Global:Bigipreportconfig.Settings.SupportCheck.Enabled -ne "true") {
        log info "Support Checks has been disabled, skipping"
        return @{}
    }

    if ($State.ContainsKey("supportStates")) {
        $SupportStates = $State["supportStates"]
    } else {
        $SupportStates = @{}
    }

    $IgnoredDevices = @()
    # Add the ignored devices
    if ("Device" -in  $SupportCheckConfig.IgnoredDevices.PSobject.Properties.Name) {
        $IgnoredDevices = $SupportCheckConfig.IgnoredDevices.Device
    }

    log info "Checking support entitlements"
    $Username = $env:F5_SUPPORT_USERNAME
    $Password = $env:F5_SUPPORT_PASSWORD

    # If the environment variables are not set, use the configuration file credentials
    if ($null -eq $Username) {
        $Username = $SupportCheckConfig.Username
    }
    if ($null -eq $Password) {
        $Password = $SupportCheckConfig.Password
    }

    $LoginBody = @{"user_id" = $Username; "user_secret" = $Password; "app_id"="support"}

    Try {
        # Get a session
        $F5SupportSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
        $Response = Invoke-WebRequest -Headers @{ "Content-Type" = "application/json"} -WebSession $F5SupportSession -Method Post -Body $($LoginBody | ConvertTo-Json) "https://api-u.f5.com/auth/pub/sso/login/user"
    } Catch {
        log error "Unable to login to F5s support API, skipping support entitlement checks"
        Return @{}
    }

    if ($F5SupportSession.Cookies.Count -eq 0){
        log error "Unable to get a session to the F5 support portal"
        Return @{}
    }

    Foreach($DeviceName in $Global:ReportObjects.Keys){
        $Device = $Global:ReportObjects[$DeviceName]

        Foreach($Serial in @($Device.LoadBalancer.serial -split " " | Where-Object { $_ -match '^(f5-|[A-Z]|chs)' })){
            # Note. There should only be one serial number.
            # If there are more we might run into a bug where they overwrite each others statuses
            if ($SupportStates.ContainsKey($Serial)) {
                $SupportState = $SupportStates[$Serial]
            } else {
                $SupportState = @{
                    loadbalancer = $DeviceName;
                    serial = $Serial;
                    hasSupport = "false";
                    lastChecked = 0;
                    lastAlerted = 0;
                    supportErrorMessage = "";
                }
            }

            if ($DeviceName -in $IgnoredDevices){
                $SupportState.hasSupport = "ignored"
                $SupportStates[$Serial] = $SupportState
                Continue
            }

            if ([math]::Floor((Get-Date -UFormat %s)) - $SupportState.lastChecked -lt 86400) {
                log info "Using cached support data for $DeviceName ($Serial)"
                Continue
            }

            log info "Validating support for device $DeviceName ($Serial)"
            try {
                $Response = Invoke-WebRequest -WebSession $F5SupportSession -uri https://api-u.f5.com/support/cases/serialno -Method POST -Headers @{ "Content-Type" = "application/json;charset=UTF-8"} -Body $(@{"serialNo" = $Serial} | ConvertTo-Json)
                $ResponseData = $Response.Content | ConvertFrom-Json -AsHashtable
                $SupportState.hasSupport = $ResponseData.valid
                If($ResponseData.ContainsKey("errorMessage")) {
                    $SupportState.supportErrorMessage = $ResponseData.errorMessage
                }
            } catch {
                log error "Failed to connect to F5 entitlement API for $DeviceName ($Serial)"
                $SupportState = "Failed to connect to F5 entitlement API"
            }
            $SupportState.lastChecked = $Now;

            # Add to the support state file
            $SupportStates[$Serial] = $SupportState
        }
    }

    if ($AlertConfig.SlackEnabled.Trim() -eq "True") {
        $AlertsToSend = $SupportStates.Values | Where-Object { $_.hasSupport -notin @("ignored", "true") -and ($now - $_.lastAlerted) -gt $WaitSecondsBetween }

        if ($null -ne $AlertsToSend -and $SlackWebHook -ne "") {
            . modules/Send-SlackSupportStateAlert.ps1
            Send-SlackSupportStateAlert -AlertsToSend $AlertsToSend -SlackWebhook $SlackWebHook
            if($?){
                ForEach($SentAlert in $AlertsToSend){
                    $SupportStates[$SentAlert.serial].lastAlerted = $Now
                }
            }
        }
    }

    Return $SupportStates
}
