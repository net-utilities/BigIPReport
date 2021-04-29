Function Send-SlackCertificateAlert {

    Param($AlertsToSend, $AlertWhenDaysOld)

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
                    "text"= "BigIPReport has detected expiring certificates";
                }
            },
            @{
                "type"= "section";
                "text"= @{
                    "type"= "mrkdwn";
                    "text"= "Certificates expiring withing the configured notice period of $AlertWhenDaysOld days has been detected when running the report on $([System.Net.Dns]::GetHostName()).`n`nRead more about how to configure these alerts <https://loadbalancing.se|here>."
                };
                "accessory"= @{
                    "type"= "image";
                    "alt_text"= "alt text for image";
                    "image_url"= "https://loadbalancing.se/slack/expiredcert.png";
                }
            }
        )
    }

    ForEach($Certificate in $AlertsToSend) {
        $Body.blocks += @(
            @{
                "type"= "divider"
            },
            @{
                "type"= "section";
                "fields"= @(
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Loadbalancer:*`nhttps://$($Certificate.loadbalancer)";
                    },
                    @{
                        "type"= "mrkdwn";
                        "text"= "*File Name:*`n$($Certificate.fileName)";
                    },
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Common Name:*`n$($Certificate.commonName)";
                    },
                    @{
                        "type"= "mrkdwn";
                        "text"= "*Expires in (days):*`n$($Certificate.expiresInDays)";
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


