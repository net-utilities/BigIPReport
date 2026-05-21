---
title: Additional config
layout: default
nav_order: 3
---

# Additional config

Optional settings in [`bigipreportconfig.xml`](https://github.com/net-utilities/BigIPReport/blob/main/data-collector/bigipreportconfig.xml) after you complete [Installation]({{ '/installation.html' | relative_url }}).

<div class="page-toc" markdown="1">

**On this page**

- [Adjust parallel processing](#adjust-parallel-processing)
- [Adjust RestPageSize](#adjust-restpagesize)
- [Configure logging](#configure-logging)
- [Configure error reporting](#configure-error-reporting)
- [Pool member state polling](#pool-member-state-polling)
  - [Performance considerations](#performance-considerations)
  - [How to enable polling](#how-to-enable-polling)

</div>

## Adjust parallel processing

The build script runs one parent thread and one thread for each listed device. The `MaxJobs` setting controls how many parallel PowerShell jobs are launched. Increasing it works well if your build host has enough memory and CPU. Decrease it if the collector runs on a machine with fewer resources.

## Adjust RestPageSize

Some devices might have issues generating data for large configurations. To prevent timeouts from heavy API calls, use **RestPageSize** to cap objects per REST call.

For example, the default of `50` retrieves 50 virtual servers per call. With 170 virtual servers, four calls are made for that data.

A higher value can speed up report generation but may cause timeouts. A lower value slows generation but can reduce timeouts if you see them.

## Configure logging

Configure logging to make troubleshooting easier later.

Edit [`bigipreportconfig.xml`](https://github.com/net-utilities/BigIPReport/blob/main/data-collector/bigipreportconfig.xml) and update the **LogSettings** section. Examples are in the file.

## Configure error reporting

Error reporting sends email when the script runs into trouble.

Configure the **ErrorReporting** section in [`bigipreportconfig.xml`](https://github.com/net-utilities/BigIPReport/blob/main/data-collector/bigipreportconfig.xml). Examples are in the file.

## Pool member state polling

Polling uses the F5 iRules engine to determine the state of pool members which enables the report to provide the users with live updates of member states without them having access to the actual F5 interface. This is done by letting the users browser interface with the configured Status VIPs using Javascript XHR.

However, there's one caveat here. The iRule engine is a bit limited compared to the iControl interface, which means that the results is not as detailed as if using the reports original icons. Instead, the result would indicate whether the member is capable of passing traffic or not. Also, the virtual server statuses will not be changed. This might be added later on if I can figure out a reliable way to do so.

Essentially this means that the icons will not be as detailed in the main view of the report, however, the pool details would still contain the original state AND the current one.

**Here's a translation table with most of them:**

| Original icon                                                                                                             | Member Availability | Member State | Translated Real-time state | Translated icon                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/enabled-unknown.png?resize=50%2C49&ssl=1)               | No monitor assigned | Enabled      | Enabled                    | ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/green-circle-checkmark.png?resize=50%2C51&ssl=1) |
| ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/black-circle-cross-big.png?resize=50%2C51&ssl=1)        | Monitor down        | Disabled     | Down                       | ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/member-down-enabled.png?resize=50%2C51&ssl=1)    |
| ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/black-diamond-exclamationmark.png?resize=50%2C51&ssl=1) | N/A                 | Forced down  | Down                       | ![](https://i0.wp.com/loadbalancing.se/wp-content/uploads/2018/01/member-down-enabled.png?resize=50%2C51&ssl=1)    |

_If you encounter another, please let me know._

### Performance considerations

The iRule impact on the system has been tested by sending a constant barrage of requests to the status VIP. While doing this I was barely able to make a dent in the CPU usage of my lab instance. That said, you probably want to keep track on the statistics to be sure.

In order to keep the resource usage in control there's three settings in the xml config file:

* MaxPools – How many pools that can be queued up in total
* MaxQueue – How many that can be polled simultaneously
* RefreshRate – How often the state is refreshed

A tip is to start with the default settings and see if that's good enough.

### How to enable polling

Now that you understand the limitations, you can follow these steps to enable the real-time status in the report.

#### Setting up a member Status VIP

1. Open up the **bigipreport\_pool\_status.tcl** iRule located in the iRules folder in the zip file.
2. Create an iRule named **bigipreport\_pool\_status** with the content of the iRule bigipreport\_pool\_status.tcl found in the iRules folder of the bigipreport zip file.
3. Create a virtual server with an HTTP profile and assign the iRule to the virtual server. **Please note that if your BigIPReport is using SSL, so must your status VIP.**
4. Make sure that all of your report users has access via the firewall to the virtual server.

#### Prerequisites

##### If your bigipreport instance use HTTPS

Since the polling uses XHR the following conditions must be true:

1. Your status VIPs **must** use HTTPS.
2. Your status VIP **must** have a DNS pointed to it.
3. Your status VIP **must** have an SSL certificate that validates the DNS.
4. The SSL certificate **must** be trusted by the clients.

#### Configuring the report to use it

In the device group section of the configuration, define the URL to the member status VIP. Here's the example form the configuration file itself.

```
 <DeviceGroups>
     <DeviceGroup>
          <Name>F5YP Devices</Name>
          <StatusVip>https://poolstatus.j.local</StatusVip>
          <Devices>
              <Device>
                   <IP>192.168.10.23</IP>
              </Device>
              <Device>
                   <IP>192.168.10.24</IP>
              </Device>
           </Devices>
      </DeviceGroup>
 </DeviceGroups>
```

If you have any problems with the member endpoints you can check out these sections from the [FAQ]({{ '/faq.html' | relative_url }}):

* [The member status polling says it's disabled]({{ '/faq.html#the-member-status-polling-says-its-disabled' | relative_url }})
* [One or more status endpoints has been marked as failed]({{ '/faq.html#one-or-more-status-endpoints-has-been-marked-as-failed' | relative_url }})
