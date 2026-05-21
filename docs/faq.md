---
title: FAQ
layout: default
nav_order: 8
---

# FAQ

Common issues when running the collector, serving the report, or using optional features. For install steps see [Installation]({{ '/installation.html' | relative_url }}); for version bumps see [Upgrading]({{ '/upgrading.html' | relative_url }}).

<div class="page-toc" markdown="1">

**On this page**

- [Collector and BIG-IP](#collector-and-big-ip)
  - [Unable to get a token from the device](#unable-to-get-a-token-from-the-device)
  - [No certificate information is shown](#no-certificate-information-is-shown)
  - [The script finished, but no file was written](#the-script-finished-but-no-file-was-written)
  - [The script failed but no email was sent](#the-script-failed-but-no-email-was-sent)
  - [Scheduled runs do not write files](#scheduled-runs-do-not-write-files)
- [Web server and UI](#web-server-and-ui)
  - [HTTP 403 when opening the report URL](#http-403-when-opening-the-report-url)
  - [The report looks wrong or outdated](#the-report-looks-wrong-or-outdated)
  - [Missing JSON files in the browser](#missing-json-files-in-the-browser)
- [Pool member polling](#pool-member-polling)
  - [Status polling shows as disabled](#status-polling-shows-as-disabled)
  - [One or more status endpoints has failed](#one-or-more-status-endpoints-has-failed)
- [Authentication](#authentication)
- [Brotli compression](#brotli-compression)
  - [Docker and Kubernetes](#docker-and-kubernetes)
  - [F5, IIS, Apache, and nginx](#f5-iis-apache-and-nginx)
  - [Verify Brotli is active](#verify-brotli-is-active)

</div>

## Collector and BIG-IP

### Unable to get a token from the device

#### Authentication errors for the report user

{: .note }
The report user needs the **Auditor** role on **all partitions**. Guest is not sufficient for full REST data (including certificates).

1. Confirm the credentials by logging into the BIG-IP web UI as the report user.
2. If you use LDAP on v14, see [F5 bug ID881085](https://cdn.f5.com/product/bugtracker/ID881085.html).
3. If the user is already an Auditor, try clearing the REST API cache and restarting `mcpd`: [K30288514](https://support.f5.com/csp/article/K30288514).

#### Authentication failed — see inner exception

This often points at TLS cipher mismatch between PowerShell and the management interface.

List configured ciphers:

```shell
tmsh sys httpd ssl-ciphersuite
```

Pass that string to `tmm --clientciphers` to see what the management plane supports:

```shell
tmm --clientciphers '<cipher string from above>'
```

Align client and management ciphers per F5 documentation if they do not overlap.

### No certificate information is shown

The report user must be **Auditor** on all partitions. Certificate data is not available to Guest accounts over the REST API.

### The script finished, but no file was written

Run the collector manually and inspect the log output.

| Symptom | What to do |
| -------- | ----------- |
| Cannot connect to one or more devices | Remove or fix the failing device; verify report user credentials. |
| Collector user cannot write to the report folder | Grant write access on `ReportRoot`, or use a configured SMB share in `bigipreportconfig.xml`. |
| Collector and web server are on different hosts | Open the firewall between the collector host and the web root. |

### The script failed but no email was sent

Run manually against one device for detailed errors:

```powershell
pwsh -NoProfile -File ./bigipreport.ps1 ./bigipreportconfig.xml loadbalancer.example.com
```

Replace `loadbalancer.example.com` with a device from your config. This run is for troubleshooting only—it does not produce a full report.

| Symptom | What to do |
| -------- | ----------- |
| SMTP blocked from the collector host | Allow outbound SMTP through the firewall. |
| Mail server rejects relay | Permit relay from the collector host or service account. |

### Scheduled runs do not write files

Run the same command as the scheduled task, in a PowerShell session **as that user**.

| Symptom | What to do |
| -------- | ----------- |
| No write access to the log folder | Fix permissions on the configured log path. |
| Task user lacks “Log on as batch job” | Grant via Group Policy (Windows). |
| Pre-execution checks failed | Run as the service user and resolve the reported error. |
| No write access to the report directory | Grant write on `ReportRoot` / the IIS or nginx docroot. |

---

## Web server and UI

### HTTP 403 when opening the report URL

The web server default document list probably does not include your report entry page.

- Add your report HTML filename to the server’s default documents, **or**
- Set `DefaultDocument` in `bigipreportconfig.xml` to a name the server already serves, **or**
- Open the report with the full path (for example `https://bigipreport.example.com/index.html`).

### The report looks wrong or outdated

| Symptom | What to do |
| -------- | ----------- |
| Frontend does not match collector version | Follow [Upgrading]({{ '/upgrading.html' | relative_url }}) for your install method; update **both** collector and `frontend/underlay` together. |
| A JavaScript file failed to load | Copy the error from the browser developer console and report it on [DevCentral](https://devcentral.f5.com/codeshare/bigip-report). |

### Missing JSON files in the browser

#### IIS 7.x or older

Add a MIME type: extension `.json`, type `application/json`.

If that is not enough, add `web.config` in the site root:

```xml
<system.webServer>
  <staticContent>
    <mimeMap fileExtension=".json" mimeType="application/json" />
  </staticContent>
</system.webServer>
```

#### Other web servers

Usually permissions or connectivity during collection. Check collector logs and that `json/` under the web root contains fresh `.json` files after a run.

---

## Pool member polling

### Status polling shows as disabled

JavaScript could not reach a working status endpoint. See [One or more status endpoints has failed](#one-or-more-status-endpoints-has-failed) below, and the setup steps in [Pool member state polling]({{ '/additional-config.html#pool-member-state-polling' | relative_url }}).

### One or more status endpoints has failed

Before polling starts, the UI probes each configured status VIP. Check the browser JavaScript console first.

| Symptom | What to do |
| -------- | ----------- |
| Status VIP uses HTTP while the report uses HTTPS | Use HTTPS on the status VIP (preferred), or serve the report over HTTP (not recommended). |
| Certificate not trusted by clients | Use a CA-trusted certificate on the status VIP. |
| DNS name does not resolve for users | Publish a resolvable hostname for the VIP. |
| Status VIP exists on only one device in a sync group | Sync the config to all devices in the group. |

---

## Authentication

BigIPReport has no built-in login. Restrict access at the reverse proxy, web server, or F5 in front of the UI and JSON.

- **F5 APM** — Access Policy on a virtual server. Walkthrough: [Protecting BigIP Report behind an APM](https://loadbalancing.se/2018/04/08/protecting-bigip-report-behind-an-apm-by-shannon-poole/) (2018; may be out of date).
- **Ingress or API gateway** — HTTP basic auth or OAuth in front of [Docker]({{ '/installation/docker.html' | relative_url }}) or [Kubernetes]({{ '/installation/kubernetes.html' | relative_url }}).
- **IIS** — Integrated Windows auth or site restrictions; see [Windows install]({{ '/installation/windows.html' | relative_url }}).
- **Apache or nginx** — `auth_basic`, LDAP, or SSO on a [Linux install]({{ '/installation/linux.html' | relative_url }}).

{: .important }
If you use [pool member state polling]({{ '/additional-config.html#pool-member-state-polling' | relative_url }}), clients must still reach each pool **status VIP** from the browser—the main site login does not apply to those URLs.

---

## Brotli compression

Brotli shrinks CSS, JSON, and JavaScript compared to gzip. Enable it in config and serve `.br` files from your web tier.

```xml
<UseBrotli>true</UseBrotli>
```

{: .warning }
Browsers only negotiate Brotli over **HTTPS**. Plain HTTP will not use `content-encoding: br`.

### Docker and Kubernetes

Published frontend images (including `latest`) serve precompressed `.br` when the client sends `Accept-Encoding: br`. Terminate HTTPS at Ingress or your proxy.

### F5, IIS, Apache, and nginx

| Platform | Reference |
| -------- | --------- |
| F5 iRule | [`contrib/ServeBrotliViaF5/serve-brotli.tcl`](https://github.com/net-utilities/BigIPReport/blob/main/contrib/ServeBrotliViaF5/serve-brotli.tcl) |
| IIS | [`contrib/iis/web.config`](https://github.com/net-utilities/BigIPReport/blob/main/contrib/iis/web.config) |
| Apache | [`contrib/apache/brotli.conf`](https://github.com/net-utilities/BigIPReport/blob/main/contrib/apache/brotli.conf) |
| nginx | [`frontend/nginx/default.conf`](https://github.com/net-utilities/BigIPReport/blob/main/frontend/nginx/default.conf); [Linux install]({{ '/installation/linux.html' | relative_url }}) includes a native example. |

### Verify Brotli is active

```shell
curl -I -H "Accept-Encoding: br" https://bigipreport.example.com/json/pools.json
```

Look for `content-encoding: br`. In Chrome DevTools → **Network**, reload the report and confirm the same header on JSON responses.
