---
title: Linux
layout: default
parent: Installation
nav_order: 3
---

# Linux

Use the native Linux install when you cannot run containers or when you want BigIPReport on an existing web server and system scheduler. If you are starting from scratch, [Docker]({{ '/installation/docker.html' | relative_url }}) is usually simpler.

The steps below use `/opt/bigipreport` as the install root. The web UI is served from `frontend/underlay/` in that clone so `git pull` updates static files without a separate copy step. The collector writes JSON under `frontend/underlay/json/`. You can use other paths if you update the commands and `ReportRoot` consistently.

<div class="page-toc" markdown="1">

**On this page**

- [1. Check prerequisites](#1-check-prerequisites)
- [2. Create a dedicated host user](#2-create-a-dedicated-host-user)
- [3. Clone the repository and create local directories](#3-clone-the-repository-and-create-local-directories)
- [4. Copy the example configuration](#4-copy-the-example-configuration)
  - [Example: nginx](#example-nginx)
- [5. Configure device groups](#5-configure-device-groups)
- [6. Configure credentials and report path](#6-configure-credentials-and-report-path)
- [7. Test the collector](#7-test-the-collector)
- [8. Schedule collection with cron](#8-schedule-collection-with-cron)
- [Optional: change how often data is collected](#optional-change-how-often-data-is-collected)
- [Useful commands](#useful-commands)

</div>

## 1. Check prerequisites

Make sure you have:

- [PowerShell 7 or newer](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-linux) (`pwsh`).
- A web server (Apache, nginx, or similar) that can serve `/opt/bigipreport/frontend/underlay/`.
- HTTPS access from the Linux host to each BIG-IP management interface.
- A configured [BIG-IP report user]({{ '/installation/prepare-f5.html' | relative_url }}).

## 2. Create a dedicated host user

Create a system account and the install directory. Run the following as a user with `sudo` (the `bigipreport` account does not need sudo):

```shell
sudo useradd --system -s /bin/bash bigipreport
sudo mkdir -p /opt/bigipreport
sudo chown bigipreport:bigipreport /opt/bigipreport
```

Switch to the service user. Steps 3–7 run as `bigipreport` from `/opt/bigipreport` without sudo:

```shell
sudo su - bigipreport
```

## 3. Clone the repository and create local directories

Clone the repository and create `config/` for your customized XML:

```shell
cd /opt/bigipreport
git clone https://github.com/net-utilities/BigIPReport.git .
mkdir -p config
```

## 4. Copy the example configuration

Copy the example BIG-IP config:

```shell
cp /opt/bigipreport/data-collector/bigipreportconfig.xml /opt/bigipreport/config/bigipreportconfig.xml
chmod 600 /opt/bigipreport/config/bigipreportconfig.xml
```

Configure your web server with document root `/opt/bigipreport/frontend/underlay` (for example `http://your-server/` if that path is the vhost root, or an alias/subpath if you mount it elsewhere). The web server process must be able to read `frontend/underlay` and `frontend/underlay/json` (often owned by `bigipreport`); grant traverse/read to the server user if needed, for example `chmod o+rX /opt/bigipreport/frontend/underlay`.

### Example: nginx

On Debian/Ubuntu, `conf.d/*.conf` is included inside the `http` block, so you can use one file with both the `map` (defines `$brotli_suffix`) and the `server` block. Save the sample below as `/etc/nginx/conf.d/bigipreport.conf`, adjust `listen` and `root` if needed, then run `sudo nginx -t` and reload nginx.

```nginx
map $http_accept_encoding $brotli_suffix {
    default "";
    "~*\bbr\b" ".br";
}

server {
    listen 8080;
    listen [::]:8080;

    root /opt/bigipreport/frontend/underlay/;

    # Serve collector-generated foo.json.br when the client accepts Brotli.
    set $brotli_extension $brotli_suffix;
    if ($uri !~ /json/[^/]+\.json$) {
        set $brotli_extension "";
    }
    set $brotli_rewrite $brotli_extension;
    if ($brotli_extension = "") {
        set $brotli_rewrite "off";
    }
    if (-f $request_filename$brotli_extension) {
        set $brotli_rewrite "${brotli_rewrite}+file";
    }
    if ($brotli_rewrite = ".br+file") {
        rewrite ^(.*)$ $1$brotli_extension break;
    }

    location ~ /json/[^/]+\.json\.br$ {
        gzip off;
        types {};
        default_type application/json;
        add_header Content-Encoding br;
        add_header Vary Accept-Encoding;
    }

    location / {
        index index.html index.htm;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

## 5. Configure device groups

Edit `/opt/bigipreport/config/bigipreportconfig.xml` and configure your device groups:

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

## 6. Configure credentials and report path

Populate the credentials in the config:

```xml
<Credentials>
    <Username></Username>
    <Password></Password>
</Credentials>
```

Set `ReportRoot` in `config/bigipreportconfig.xml` to the same directory the web server serves (the collector appends `json/*.json` under this path):

```xml
<ReportRoot>/opt/bigipreport/frontend/underlay/</ReportRoot>
```

## 7. Test the collector

Run one collection:

```shell
cd /opt/bigipreport/data-collector && pwsh -NoProfile -File /opt/bigipreport/data-collector/bigipreport.ps1 /opt/bigipreport/config/bigipreportconfig.xml
```

Open the site in your browser using the URL your web server serves, for example:

```text
http://your-server/
```

You should see the report UI and JSON data under `/opt/bigipreport/frontend/underlay/json/`.

## 8. Schedule collection with cron

Exit the `bigipreport` shell if you are still logged in as that user. Run the following as root:

Create a wrapper script:

```shell
sudo tee /usr/local/bin/run-bigipreport >/dev/null <<'EOF'
#!/bin/sh
set -eu
. /etc/bigipreport.env
cd /opt/bigipreport/data-collector
exec pwsh -NoProfile -File /opt/bigipreport/data-collector/bigipreport.ps1
EOF

sudo chown root:bigipreport /usr/local/bin/run-bigipreport
sudo chmod 750 /usr/local/bin/run-bigipreport
```

Create a log file and cron entry:

```shell
sudo touch /var/log/bigipreport.log
sudo chown bigipreport:bigipreport /var/log/bigipreport.log
# This runs the collector every 30 minutes
echo '*/30 * * * * bigipreport /usr/local/bin/run-bigipreport >> /var/log/bigipreport.log 2>&1' | sudo tee /etc/cron.d/bigipreport
```

## Optional: change how often data is collected

Edit the schedule in `/etc/cron.d/bigipreport`. The example above uses `*/30` (every 30 minutes). See `man 5 crontab` for other expressions.

## Useful commands

Run the collector manually:

```shell
sudo -u bigipreport /usr/local/bin/run-bigipreport
```

Follow the cron log:

```shell
sudo tail -f /var/log/bigipreport.log
```

To upgrade after the initial install, see [Upgrading]({{ '/upgrading.html' | relative_url }}).
