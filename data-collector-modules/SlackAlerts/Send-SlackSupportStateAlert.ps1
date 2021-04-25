
Function Send-SlackSupportStateAlert {

    Param($AlertsToSend)
    log info "This would have been an alert"
    log info "$($AlertsToSend | ConvertTo-Json)"

}