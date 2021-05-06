Function Send-SlackFailedDeviceAlert(){
    Param($AlertsToSend)

    if ($null -eq $AlertsToSend -or $AlertsToSend.Count -eq 0) {
        log error "Send-SlackCertificateAlert function got a call with no alerts to send"
        Return
    }

    $Body = @{
        "blocks"= @(
            @{
                "type"= "header";
                "text"= @{
                    "type"= "plain_text";
                    "text"= "BigIPReport failed to index some device(s)";
                }
            },
            @{
                "type"= "section";
                "text"= @{
                    "type"= "mrkdwn";
                    "text"= "The report script was not able to get all the data it needs in order to index at least one of your devices.`nMore information can be found in the BigIPReport logs section of your report and more information about configuring this alert can be found <https://loadbalancing.se|here>."
                };
                "accessory"= @{
                    "type"= "image";
                    "alt_text"= "alt text for image";
                    "image_url"= "https://loadbalancing.se/slack/indexingfailed3.png";
                }
            }
        )
    }

    ForEach($FailedDevice in $AlertsToSend) {
        $Body.blocks += @(
            @{
                "type"= "divider"
            },
            @{
                "type"= "section";
                "fields"= @(
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Loadbalancer:*`nhttps://$($FailedDevice.name)";
                    },
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Times failed:*`n$($FailedDevice.numberOfTimesFailed)";
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
