Function Send-SlackSupportStateAlert {

    Param($AlertsToSend, $SlackWebHook)

    if ($null -eq $AlertsToSend -or $AlertsToSend.Count -eq 0) {
        log error "Send-SlackSupportStateAlert function got a call with no alerts to send"
        Return
    }

    $Body = @{
        "blocks"= @(
            @{
                "text"= @{
                    "text"= "BigIPReport has detected invalid support agreements";
                    "type"= "plain_text";
                };
                "type"= "header";
            },
            @{
                "accessory"= @{
                    "type"= "image";
                    "image_url"= "https://loadbalancing.se/slack/supportentitlements.png";
                    "alt_text"= "alt text for image";
                };
                "type"= "section";
                "text"= @{
                    "text"= "BigIPReport is fetching support states for your devices once per day and has detected devices without support entitlement.`nYou can read more about this alert <https://loadbalancing.se|here>.";
                    "type"= "mrkdwn";
                }
            }
        )
    }

    ForEach($SupportAgreement in $AlertsToSend) {
        $Body.blocks += @(
            @{
                "type"= "divider";
            },
            @{
                "type"= "section";
                "fields"= @(
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Device name*:`n<https://$($SupportAgreement.loadbalancer)|$($SupportAgreement.loadbalancer)>"
                    },
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Support API Response*`n$($SupportAgreement.supportErrorMessage)"
                    }
                )
            }
        )
    }

    Try {
        $Response = Invoke-WebRequest -Method POST -Headers @{"Content-Type" = "application/json"} -Body $($Body | ConvertTo-Json -Compress -Depth 4) -Uri $SlackWebHook
    } Catch {
        log error "Failed to send Slack Web Hook"
    }

}
