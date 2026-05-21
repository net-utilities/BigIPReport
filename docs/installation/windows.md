---
title: Windows
layout: default
parent: Installation
nav_order: 4
---

# Windows

Use the native Windows install when you want to run BigIPReport with IIS and Windows Task Scheduler. If you are starting from scratch and can use containers, [Docker]({{ '/installation/docker.html' | relative_url }}) is usually simpler.

The steps below use `C:\BigIPReport` for the collector and `C:\inetpub\wwwroot\BigIPReport` for the web files. Adjust the paths if your web server uses a different document root, and update `ReportRoot` in the config to match.

<div class="page-toc" markdown="1">

**On this page**

- [1. Check prerequisites](#1-check-prerequisites)
- [2. Prepare directories and copy files](#2-prepare-directories-and-copy-files)
- [3. Configure device groups](#3-configure-device-groups)
- [4. Configure credentials and report path](#4-configure-credentials-and-report-path)
- [5. Test the collector](#5-test-the-collector)
- [6. Schedule collection with Task Scheduler](#6-schedule-collection-with-task-scheduler)

</div>

## 1. Check prerequisites

Make sure you have:

- [PowerShell 7 or newer](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows).
- IIS or another web server that can serve `C:\inetpub\wwwroot\BigIPReport`.
- HTTPS access from the Windows host to each BIG-IP management interface.
- A configured [BIG-IP report user]({{ '/installation/prepare-f5.html' | relative_url }}).

## 2. Prepare directories and copy files

Create the application and web directories:

```powershell
New-Item -ItemType Directory -Force C:\BigIPReport
New-Item -ItemType Directory -Force C:\inetpub\wwwroot\BigIPReport\json
```

Copy the data collector and frontend files from the repository root:

```powershell
Copy-Item .\data-collector\bigipreport.ps1 C:\BigIPReport\
Copy-Item .\data-collector\modules C:\BigIPReport\ -Recurse -Force
Copy-Item .\data-collector\bigipreportconfig.xml C:\BigIPReport\
Copy-Item .\frontend\underlay\* C:\inetpub\wwwroot\BigIPReport\ -Recurse -Force
```

Configure IIS (or your web server) so the site is reachable at your chosen URL, for example `http://your-server/BigIPReport/`. The account that runs the collector must be able to write to `C:\inetpub\wwwroot\BigIPReport\json`.

## 3. Configure device groups

Edit `C:\BigIPReport\bigipreportconfig.xml` and configure your device groups:

```xml
<DeviceGroups>
    <DeviceGroup>
        <Name>Production</Name>
        <Device>bigip-a.example.com</Device>
        <Device>bigip-b.example.com</Device>
        <StatusVip></StatusVip>
    </DeviceGroup>
</DeviceGroups>
```

StatusVip is optional. See [Pool member state polling]({{ '/additional-config.html#pool-member-state-polling' | relative_url }}) in [Additional config]({{ '/additional-config.html' | relative_url }}).

## 4. Configure credentials and report path

Populate the credentials in the config:

```xml
<Credentials>
    <Username>bigipreport</Username>
    <Password>change-this-password</Password>
</Credentials>
```

Set `ReportRoot` and `DefaultDocument` to match the web directory from step 2:

```xml
<ReportRoot>C:/inetpub/wwwroot/BigIPReport/</ReportRoot>
<DefaultDocument>index.html</DefaultDocument>
```

Use forward slashes in `ReportRoot`; they work well across platforms and avoid escaping issues in XML.

## 5. Test the collector

Open PowerShell as the user that will run the scheduled task, then run:

```powershell
Set-Location C:\BigIPReport
pwsh -NoProfile -File .\bigipreport.ps1
```

Open the report in your browser, for example:

```text
http://your-server/BigIPReport/
```

You should see the report UI and JSON data under `C:\inetpub\wwwroot\BigIPReport\json\`.

## 6. Schedule collection with Task Scheduler

Create a scheduled task that runs the collector on your preferred interval.

Use these action settings:

```text
Program/script: pwsh.exe
Add arguments: -NoProfile -ExecutionPolicy Bypass -File C:\BigIPReport\bigipreport.ps1
Start in: C:\BigIPReport
```

Recommended task settings:

- Run whether the user is logged on or not.
- Run with a dedicated local or domain service account.
- Use a trigger such as every 30 minutes.
- Confirm the task user can write to `C:\inetpub\wwwroot\BigIPReport\json`.
