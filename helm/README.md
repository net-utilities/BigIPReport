# BigIPReport Helm chart

This chart deploys [BigIPReport](https://github.com/net-utilities/BigIPReport): a web UI for F5 BIG-IP LTM configuration across multiple devices. It runs a **frontend** (nginx) and a **CronJob** that periodically collects JSON into a shared volume.

## What gets installed

| Resource | Purpose |
|----------|---------|
| `Deployment` | Serves the static report UI on port 8080 inside the pod |
| `Service` | HTTP on port 80 → frontend 8080; `type` from `frontend.service.type` (default `ClusterIP`) |
| `CronJob` | Runs the data collector on your schedule |
| `PersistentVolumeClaim` | Read-write storage for JSON underlay (RWO) |
| `ConfigMap` | `bigipreportconfig.xml` for the collector |

Resource names are prefixed with the Helm release name (e.g. `myrel-bigipreport-frontend`) so multiple releases can coexist in one namespace.

Pod affinity to the frontend pod is **required** so both workloads share the same **ReadWriteOnce** volume on one node. Until the frontend pod is running and scheduled, collector Jobs may stay **Pending**—that is expected (there is nothing to collect without the UI).

## Prerequisites

- A cluster that can satisfy the chart’s RWO PVC (default or explicit `persistentStorage.storageClassName`).
- A `Secret` in the release namespace with `F5_USERNAME` and `F5_PASSWORD` for iControl/API access. The chart references its name via `dataCollector.secret.name` (default `bigipreport-secrets`).

  ```bash
  kubectl create secret generic bigipreport-secrets \
    --from-literal=F5_USERNAME='…' \
    --from-literal=F5_PASSWORD='…' \
    -n <namespace>
  ```

### Optional: validate prerequisites at install time

Set **`validateResources: true`** (or `--set validateResources=true`) on `helm install` / `helm upgrade` when Helm can reach the cluster API. The chart then verifies, before applying manifests:

- The F5 credentials `Secret` (`dataCollector.secret.name`) exists and has `F5_USERNAME` and `F5_PASSWORD`
- `config.existingConfigMap` exists with a `bigipreportconfig.xml` key, if set
- `ingress.tlsSecretName` exists, if ingress TLS is enabled

## Configuration file (`bigipreportconfig.xml`)

The chart does **not** bundle `bigipreportconfig.xml`. You must supply your environment’s config at install time. The canonical example in this repository is [`data-collector/bigipreportconfig.xml`](../data-collector/bigipreportconfig.xml) — copy and edit it for your BIG-IPs and device groups.

Helm renders the XML into a ConfigMap named `<release>-bigipreport-config`, unless you point at an existing ConfigMap (see below).

**Recommended:** pass the file with `--set-file` so your values YAML stays small:

```bash
helm upgrade --install bigipreport oci://ghcr.io/net-utilities/charts/bigipreport \
  -f my-values.yaml \
  --set-file config.xml=./bigipreportconfig.xml \
  -n bigipreport --create-namespace
```

You can also set `config.xml` inline in a values file just like the previous chart. Just not that the install will fail if neither `config.xml` nor `config.existingConfigMap` is set.

### Pre-existing ConfigMap

To manage the ConfigMap outside Helm, set `config.existingConfigMap` to its name. The chart will not create a ConfigMap and the collector mounts yours instead.

## Install

From OCI (don't forget to create the F5 credentials secret):

```bash
helm upgrade --install bigipreport oci://ghcr.io/net-utilities/charts/bigipreport \
  -f my-values.yaml \
  --set-file config.xml=./bigipreportconfig.xml \
  --set validateResources=true \
  -n bigipreport --create-namespace
```

From a local chart directory (development):

```bash
helm upgrade --install bigipreport ./helm \
  -f my-values.yaml \
  --set-file config.xml=./bigipreportconfig.xml \
  -n bigipreport --create-namespace
```

Render manifests without applying:

```bash
helm template bigipreport ./helm \
  -f my-values.yaml \
  --set-file config.xml=./bigipreportconfig.xml
```

## Configuration (`values.yaml`)

[`values.yaml`](values.yaml) only contains the knobs most installs need. Defaults for image tags come from [`Chart.yaml`](Chart.yaml) `appVersion` when `image.tag` is empty.

| Key | Description | Default |
|-----|-------------|---------|
| `validateResources` | Check cluster for prerequisite Secrets/ConfigMaps at install | `false` |
| `config.xml` | Full `bigipreportconfig.xml` content (required unless `config.existingConfigMap` is set) | `""` |
| `config.existingConfigMap` | Use an existing ConfigMap instead of creating one | `""` |
| `dataCollector.image.repository` | Data collector image | `ghcr.io/net-utilities/bigipreport-data-collector` |
| `dataCollector.image.tag` | Image tag; empty uses `Chart.yaml` `appVersion` | `""` |
| `dataCollector.schedule` | Cron schedule for the collector | `*/30 * * * *` |
| `dataCollector.secret.name` | Secret with `F5_USERNAME` / `F5_PASSWORD` | `bigipreport-secrets` |
| `dataCollector.resources` | Collector CPU/memory requests and limits | see `values.yaml` |
| `dataCollector.concurrencyPolicy` | CronJob overlap policy (`Allow` / `Forbid` / `Replace`) | `Forbid` |
| `dataCollector.activeDeadlineSeconds` | Per-job timeout | `1800` |
| `dataCollector.backoffLimit` | Job retries | `1` |
| `frontend.replicas` | Frontend replicas (RWO design expects `1`) | `1` |
| `frontend.service.type` | Kubernetes `Service` `spec.type` (`ClusterIP`, `NodePort`, or `LoadBalancer`) | `ClusterIP` |
| `frontend.image.repository` | Frontend image | `ghcr.io/net-utilities/bigipreport-frontend` |
| `frontend.image.tag` | Image tag; empty uses `Chart.yaml` `appVersion` | `""` |
| `frontend.resources` | Frontend CPU/memory requests and limits | see `values.yaml` |
| `persistentStorage.size` | PVC size | `100Mi` |
| `persistentStorage.storageClassName` | PVC `storageClassName`; empty uses cluster default | `""` |
| `ingress.enabled` | Expose the UI via Ingress | `true` |
| `ingress.host` | Ingress hostname | `bigipreport.site.com` |
| `ingress.tls` | Enable HTTPS on the Ingress | `false` |
| `ingress.tlsSecretName` | Name of an **existing** TLS Secret (only when cert-manager is off) | `""` |
| `ingress.certManager.enabled` | Issue a cert via cert-manager (`<release>-bigipreport-tls` secret) | `false` |
| `ingress.certManager.clusterIssuer` | `ClusterIssuer` name (e.g. `letsencrypt-prod`) | `""` |
| `ingress.certManager.issuer` | Namespaced `Issuer` name (use instead of `clusterIssuer`) | `""` |

### TLS with cert-manager

When [cert-manager](https://cert-manager.io/) is installed in the cluster, the chart requests a certificate and wires the Ingress to the generated Secret `<release>-bigipreport-tls`. Do not set `ingress.tlsSecretName` in that mode — use it only for a cert you manage yourself:

```yaml
ingress:
  enabled: true
  host: bigipreport.example.com
  className: cilium
  tls: true
  certManager:
    enabled: true
    clusterIssuer: letsencrypt-prod
```

Use `issuer` instead of `clusterIssuer` for a namespaced Issuer. The TLS Secret is created by cert-manager; with `validateResources: true` the chart does not require the Secret to exist before install.
