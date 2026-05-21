---
title: Docker
layout: default
parent: Installation
nav_order: 2
---

# Docker

Docker is the way to run BigIPReport in containers. It starts both the frontend and the scheduled data collector.

Inside the containers, the data collector runs as a non-root `bigipreport` user and the frontend uses an unprivileged nginx image. On the **host**, avoid running `docker compose` as `root` on Linux servers; create a dedicated user in the `docker` group first (step 2) so `config/`, `secrets/`, and the repo are owned by that user from the start.

<div class="page-toc" markdown="1">

**On this page**

- [1. Check prerequisites](#1-check-prerequisites)
- [2. Create a dedicated host user (Linux)](#2-create-a-dedicated-host-user-linux)
- [3. Create local directories](#3-create-local-directories)
- [4. Copy the example configuration](#4-copy-the-example-configuration)
- [5. Configure device groups](#5-configure-device-groups)
- [6. Configure credentials](#6-configure-credentials)
- [7. Start the stack](#7-start-the-stack)
- [Optional: build from local source](#optional-build-from-local-source)
- [Optional: pin a specific image version](#optional-pin-a-specific-image-version)
- [Optional: change how often data is collected](#optional-change-how-often-data-is-collected)
- [Useful commands](#useful-commands)

</div>

## 1. Check prerequisites

Make sure you have:

- Docker with Compose support.
- HTTPS access from the Docker host to each BIG-IP management interface.
- A configured [BIG-IP report user]({{ '/installation/prepare-f5.html' | relative_url }}).

## 2. Create a dedicated host user (Linux)

On Linux, set up a service account before creating `config/` or `secrets/`. The user must be in the `docker` group so it can run Compose without `root`.

If you use **Docker Desktop on macOS**, skip this step. Clone the repository anywhere convenient and run steps 3–7 as your normal login user.

Create the user and add it to the `docker` group (once per host):

```shell
sudo useradd --system -d /opt/bigipreport -m -s /bin/bash bigipreport
sudo usermod -aG docker bigipreport
```

Clone the repository and give ownership to that user:

```shell
sudo git clone https://github.com/net-utilities/BigIPReport.git /opt/bigipreport
sudo chown -R bigipreport:bigipreport /opt/bigipreport
```

Switch to the user (use `su -` for a login shell). Group membership for `docker` applies after re-login; if `docker compose` fails with permission errors, log out and back in, or run `newgrp docker` once:

```shell
sudo su - bigipreport
```

Steps 3–7 below are run from `/opt/bigipreport` as `bigipreport`, not as `root`.

## 3. Create local directories

Create directories for the configuration file and local secret files:

```shell
mkdir -p config secrets
```

## 4. Copy the example configuration

Copy the example configuration:

```shell
cp ./data-collector/bigipreportconfig.xml config/bigipreportconfig.xml
```

## 5. Configure device groups

Edit `config/bigipreportconfig.xml` and configure your device groups:

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

## 6. Configure credentials

Leave the credentials section in the config empty. Compose mounts the credentials as [Compose secrets](https://docs.docker.com/compose/use-secrets/):

```xml
<Credentials>
    <Username></Username>
    <Password></Password>
</Credentials>
```

The credentials are **not** stored in `docker-compose.yml` or container environment variables. Instead, compose injects them into the data collector at `/run/secrets/f5_username` and `/run/secrets/f5_password`, which the collector reads at runtime.

Create two files with the BIG-IP report username and password under `secrets/`. Use a text editor (avoid trailing newlines) or:

```shell
printf '%s' 'bigipreport' > secrets/f5_username
printf '%s' 'change-this-password' > secrets/f5_password
chmod 600 secrets/f5_*
```

Avoid putting passwords in `bigipreportconfig.xml`; the collector is meant to read credentials from `/run/secrets/` at runtime.

## 7. Start the stack

Start the frontend and data collector. Compose pulls the published images from GitHub Container Registry if they are not already on your machine:

```shell
docker compose up -d
```

The compose file uses the published **`latest`** images:

- `ghcr.io/net-utilities/bigipreport-data-collector:latest`
- `ghcr.io/net-utilities/bigipreport-frontend:latest`

Open `http://localhost:8080`. The data collector should fetch data from your configured BIG-IP devices and the frontend should serve the generated report.

To watch the first startup in the foreground instead, omit `-d`:

```shell
docker compose up
```

If everything works, stop the foreground process with Ctrl+C and start it again in the background with `docker compose up -d`.

## Optional: build from local source

The compose file also includes `build` instructions for both services. Images are built only when you pass `--build`; a normal `docker compose up` uses the registry images above.

Build and run from the repository source:

```shell
docker compose up -d --build
```

## Optional: pin a specific image version

By default the stack tracks **`latest`** from GHCR, so you do not need to change `docker-compose.yml` when a new release is published. Pull fresh images after an upgrade:

```shell
docker compose pull
docker compose up -d
```

To stay on a fixed version instead, edit the `image:` tags in `docker-compose.yml` (for example `:5.7.0`).

## Optional: change how often data is collected

The compose file sets `COLLECT_INTERVAL_MINUTES` to **30** (minutes between the start of each collection run). The loop subtracts how long the previous run took, then waits for the remainder. If a run takes longer than the period, the next run starts immediately.

To change the interval, edit `COLLECT_INTERVAL_MINUTES` under `data-collector` in `docker-compose.yml`, then run `docker compose up -d` again.

## Useful commands

View logs:

```shell
docker compose logs -f data-collector frontend
```

Stop the stack:

```shell
docker compose down
```

Stop the stack and delete generated report data:

```shell
docker compose down -v
```
