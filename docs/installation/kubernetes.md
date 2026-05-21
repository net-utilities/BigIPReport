---
title: Kubernetes
layout: default
parent: Installation
nav_order: 5
---

# Kubernetes

Use Kubernetes when you already run applications with Helm and want BigIPReport managed by your cluster. The chart deploys a frontend Deployment, a data collector CronJob, a shared persistent volume, and a ConfigMap for `bigipreportconfig.xml`.

The collector and frontend images are published on GHCR (`ghcr.io/net-utilities/bigipreport-data-collector` and `ghcr.io/net-utilities/bigipreport-frontend`).

<div class="page-toc" markdown="1">

**On this page**

- [1. Check prerequisites](#1-check-prerequisites)
- [2. Create the namespace and Secret](#2-create-the-namespace-and-secret)
- [3. Create a local config directory](#3-create-a-local-config-directory)
- [4. Copy the example configuration and Helm values](#4-copy-the-example-configuration-and-helm-values)
- [5. Configure device groups](#5-configure-device-groups)
- [6. Leave XML credentials empty](#6-leave-xml-credentials-empty)
- [7. Customize Helm values](#7-customize-helm-values)
- [8. Install with Helm](#8-install-with-helm)
- [9. Verify the deployment](#9-verify-the-deployment)
- [Optional: install from the local chart](#optional-install-from-the-local-chart)
- [Optional: render manifests without installing](#optional-render-manifests-without-installing)
- [Useful commands](#useful-commands)

</div>

## 1. Check prerequisites

Make sure you have:

- A Kubernetes cluster with a storage class that can satisfy a ReadWriteOnce PVC.
- `kubectl` and `helm` installed
- HTTPS access from the data collector pods to each BIG-IP management interface.
- A configured [BIG-IP report user]({{ '/installation/prepare-f5.html' | relative_url }}).

Run the steps below from a machine with cluster access. Use a clone of this repository as the working directory.

## 2. Create the namespace and Secret

Create a namespace and a Kubernetes Secret for the BIG-IP report user. The collector reads `F5_USERNAME` and `F5_PASSWORD` from this Secret at runtime.

```shell
kubectl create namespace bigipreport

kubectl create secret generic bigipreport-secrets \
  --from-literal=F5_USERNAME='bigipreport' \
  --from-literal=F5_PASSWORD='change-this-password' \
  -n bigipreport
```

Avoid putting passwords in `bigipreportconfig.xml`; the collector prefers the Kubernetes Secret.

## 3. Create a local config directory

Create `config/` for files you customize locally (this directory is gitignored):

```shell
mkdir -p config
```

## 4. Copy the example configuration and Helm values

Copy the example BIG-IP config and the chart defaults into `config/`:

```shell
cp ./data-collector/bigipreportconfig.xml config/bigipreportconfig.xml
cp ./helm/values.yaml config/values.yaml
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

## 6. Leave XML credentials empty

```xml
<Credentials>
    <Username></Username>
    <Password></Password>
</Credentials>
```

## 7. Customize Helm values

Edit `config/values.yaml` for your cluster. At minimum, set `ingress.host` to a hostname your Ingress controller can reach. The default `dataCollector.secret.name` is `bigipreport-secrets` — it must match the Secret from step 2.

Other common changes:

- `ingress.className`, `ingress.tls`, or `ingress.certManager` for HTTPS
- `frontend.service.type` if you expose the UI without Ingress (for example `LoadBalancer`)
- `dataCollector.schedule` (default: every 30 minutes, `*/30 * * * *`)
- `egress.cilium`, `egress.istio.serviceEntry`, or `egress.networkPolicy` if the cluster restricts collector egress to BIG-IP management hosts

The copied file includes comments for each option. For the full reference, see the [Helm chart README](https://github.com/net-utilities/BigIPReport/blob/main/helm/README.md).

## 8. Install with Helm

Install from the published OCI chart:

```shell
helm upgrade --install bigipreport oci://ghcr.io/net-utilities/charts/bigipreport \
  -f config/values.yaml \
  --set-file config.xml=./config/bigipreportconfig.xml \
  --set validateResources=true \
  -n bigipreport
```

Helm renders `config/bigipreportconfig.xml` into a ConfigMap for the collector. Image tags default to the chart `appVersion` when not overridden in values.

## 9. Verify the deployment

```shell
kubectl get pods -n bigipreport
kubectl get cronjobs -n bigipreport
kubectl get ingress -n bigipreport
```

Open the UI using your Ingress host or port-forward to the frontend Service. The data collector CronJob needs the frontend pod scheduled on the same node so they can share the ReadWriteOnce volume; collector Jobs may stay **Pending** until the frontend is running.

## Optional: install from the local chart

To test chart changes from this repository:

```shell
helm upgrade --install bigipreport ./helm \
  -f config/values.yaml \
  --set-file config.xml=./config/bigipreportconfig.xml \
  --set validateResources=true \
  -n bigipreport
```

## Optional: render manifests without installing

```shell
helm template bigipreport ./helm \
  -f config/values.yaml \
  --set-file config.xml=./config/bigipreportconfig.xml \
  -n bigipreport
```

## Useful commands

Follow frontend logs:

```shell
kubectl logs -n bigipreport -l app.kubernetes.io/component=frontend -f
```

Follow the latest data collector job:

```shell
kubectl logs -n bigipreport -l app.kubernetes.io/component=data-collector --tail=100 -f
```

Remove the release:

```shell
helm uninstall bigipreport -n bigipreport
```

For the full chart reference, see the [Helm chart README](https://github.com/net-utilities/BigIPReport/blob/main/helm/README.md).
