---
title: Overview
layout: default
nav_order: 1
permalink: /
---


# Introduction

This is the new version that removes the dependency on the iControl powershell plugin. This allows the script to be executed at any platform that supports Powershell (including linux).

This is a script which will generate a report of the BigIP LTM configuration on all your load balancers making it easy to find information and get a comprehensive overview of virtual servers and pools connected to them (including those specified in iRules).

## Feature requests / Help

Feel free to post any feature requests on the code share page on Devcentral. They are very much appreciated.

You can also join our [Discord](https://discord.gg/yBBEZfyRV) to ask questions.

## Requirements

On the BIG-IP side you always need:

* A dedicated report user with read access to all partitions
* HTTPS access from wherever BigIPReport runs to each device management interface

How you run BigIPReport depends on the installation method:

* **Docker** — The stack includes the data collector and web frontend.
* **Kubernetes** — A cluster and Helm.
* **Native Linux or Windows** — A host with PowerShell 7 or newer and a web server to serve the report files.

## Getting started

Start by [preparing your BIG-IPs]({{ '/installation/prepare-f5.html' | relative_url }}): create the report user and confirm management access from the host or cluster where you plan to run BigIPReport. When that is in place, follow the [Installation]({{ '/installation.html' | relative_url }}) guide to choose Docker, Kubernetes, or a native Linux or Windows setup. Docker is the quickest path for most new installs.

## Only here for the code?

Check out the [release page](https://github.com/net-utilities/BigIPReport/releases) on GitHub.
