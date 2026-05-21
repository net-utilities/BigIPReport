---
title: Upgrading
layout: default
nav_order: 7
---

# Upgrading

BigIPReport ships as container images, a Helm chart, a Linux release tarball, and source files for native installs. Pick the section that matches how you run it.

Before any upgrade, read the [release notes](https://github.com/net-utilities/BigIPReport/releases) for the target version. Large jumps may require changes to `bigipreportconfig.xml`. Compare your file with the example in the repo ([`data-collector/bigipreportconfig.xml`](https://github.com/net-utilities/BigIPReport/blob/main/data-collector/bigipreportconfig.xml)) and merge any new sections (for example [pool member state polling]({{ '/additional-config.html#pool-member-state-polling' | relative_url }})).

After upgrading, open the report in your browser and use a hard refresh (Ctrl+F5 or Cmd+Shift+R) so cached JavaScript and CSS are not mixed with a new build. If the UI looks wrong, the collector and frontend are often on mismatched versions—see the [FAQ]({{ '/faq.html#the-report-is-looking-strange' | relative_url }}).

<div class="page-toc" markdown="1">

**On this page**

- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Native Linux (git clone)](#native-linux-git-clone)
- [Native Linux (release tarball)](#native-linux-release-tarball)
- [Windows (IIS)](#windows-iis)

</div>

## Docker

If you use the default **`latest`** images, pull and restart:

```shell
docker compose pull
docker compose up -d
```

Your `config/` and `secrets/` directories are unchanged; only the container images update.

To pin a version, set both `image:` tags in `docker-compose.yml` (for example `:5.7.0`), then run `docker compose up -d`. See [Docker]({{ '/installation/docker.html' | relative_url }}) for details.

## Kubernetes

Upgrade the Helm release with the chart version you want and the same values and config you used at install time:

```shell
helm upgrade --install bigipreport oci://ghcr.io/net-utilities/charts/bigipreport \
  --version 5.7.0 \
  -f config/values.yaml \
  --set-file config.xml=./config/bigipreportconfig.xml \
  --set validateResources=true \
  -n bigipreport
```

Replace `5.7.0` with the chart version that matches your target release. Image tags default to the chart `appVersion` unless you override `dataCollector.image.tag` or `frontend.image.tag` in values.

If you only need newer images and already pin tags in values, bump those tags and run `helm upgrade` without changing the chart version.

Watch the next collector run and frontend pod after the upgrade:

```shell
kubectl rollout status deployment -n bigipreport -l app.kubernetes.io/component=frontend
kubectl logs -n bigipreport -l app.kubernetes.io/component=data-collector --tail=100
```

## Native Linux (git clone)

From your install root (for example `/opt/bigipreport`), pull the new release as the service user:

```shell
cd /opt/bigipreport
git pull
```

Static files under `frontend/underlay/` update with the repository. Review `config/bigipreportconfig.xml` against the new example and add any missing sections.

If your scheduled collector uses the default config path (`data-collector/bigipreportconfig.xml`), copy your updated config there or change the wrapper to pass `/opt/bigipreport/config/bigipreportconfig.xml` explicitly (as in the [Linux install]({{ '/installation/linux.html' | relative_url }}) test step).

Run a manual collection and check the log:

```shell
sudo -u bigipreport /usr/local/bin/run-bigipreport
sudo tail -f /var/log/bigipreport.log
```

## Native Linux (release tarball)

Download the new `bigipreport-vX.Y.Z.tar.gz` from [GitHub Releases](https://github.com/net-utilities/BigIPReport/releases). Extract it over your install tree or into a new directory, keeping your customized `bigipreportconfig.xml` and any local changes to credentials and device groups.

Update the web root with the new `underlay/` contents and replace `bigipreport.ps1` and `modules/` from the archive. Run the collector once before relying on cron again.

## Windows (IIS)

Download or clone the new release, then copy the updated files from the repository:

```powershell
Copy-Item .\data-collector\bigipreport.ps1 C:\BigIPReport\ -Force
Copy-Item .\data-collector\modules C:\BigIPReport\ -Recurse -Force
Copy-Item .\frontend\underlay\* C:\inetpub\wwwroot\BigIPReport\ -Recurse -Force
```

Keep your existing `C:\BigIPReport\bigipreportconfig.xml` unless the release notes require config changes. Run the scheduled task manually or execute:

```powershell
Set-Location C:\BigIPReport
pwsh -NoProfile -File .\bigipreport.ps1
```

Confirm the report loads and new JSON appears under `C:\inetpub\wwwroot\BigIPReport\json\`.
