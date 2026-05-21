---
title: Installation
layout: default
nav_order: 2
has_children: true
---

# Installation

All installation methods start with the same preparation step: create a dedicated BIG-IP user for BigIPReport. After that, pick the installation method that best fits where you want to run the report.

<div class="page-toc" markdown="1">

**On this page**

- [Recommended path](#recommended-path)
- [Installation steps](#installation-steps)
- [Which method should I choose?](#which-method-should-i-choose)

</div>

## Recommended path

Use [Docker]({% link installation/docker.md %}) for container deployments. It starts both parts of the application for you:

- The frontend web server.
- The scheduled data collector.

This avoids most of the manual web server, PowerShell, and scheduler setup required by native Windows or Linux installations.

## Installation steps

1. [Clone the repo](https://github.com/net-utilities/BigIPReport)
2. [Prepare the BigIPs]({{ '/installation/prepare-f5.html' | relative_url }}).
3. Choose an installation method:
   - [Docker]({% link installation/docker.md %}) — recommended for most users.
   - [Linux]({% link installation/linux.md %}) - native PowerShell, web server, and cron.
   - [Windows]({% link installation/windows.md %}) - native PowerShell, IIS, and Task Scheduler.
   - [Kubernetes]({% link installation/kubernetes.md %}) - Helm-based deployment.
4. Optional: review [Additional config]({{ '/additional-config.html' | relative_url }}) for logging, parallelism, pool member state polling, and other `bigipreportconfig.xml` settings.

## Which method should I choose?

Choose Docker if you want the simplest local or small-server deployment. Choose Kubernetes if you already operate applications with Helm and want BigIPReport managed by your cluster. Choose native Linux or Windows when you cannot use containers or need to integrate with an existing web server and scheduler.
