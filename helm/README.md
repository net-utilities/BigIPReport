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

The collector uses **required** pod affinity to the frontend pod so both workloads share the same **ReadWriteOnce** volume on one node. Until the frontend pod is running and scheduled, collector Jobs may stay **Pending**—that is expected (there is nothing to collect without the UI).

## Upgrading from chart 1.0.x

Chart **1.1.x** changes Kubernetes **Deployment** label selectors and resource names (Helm `fullname` pattern). In-place `helm upgrade` from 1.0.x can fail because **Deployment `spec.selector` is immutable**.

Typical approach: uninstall the old release (or delete the old Deployment / PVC if you manage data carefully), then install chart **1.1.x** fresh. Read release notes and back up PVC data before destructive steps.

## Prerequisites

- A cluster that can satisfy the chart’s RWO PVC (default or explicit `persistentStorage.storageClassName`).
- A `Secret` in the release namespace with `F5_USERNAME` and `F5_PASSWORD` for iControl/API access. The chart references its name via `dataCollector.secret.name` (default `bigipreport-secrets`).

  ```bash
  kubectl create secret generic bigipreport-secrets \
    --from-literal=F5_USERNAME='…' \
    --from-literal=F5_PASSWORD='…' \
    -n <namespace>
  ```

## Configuration file

Released chart artifacts ship an **example** `bigipreportconfig.xml` beside `Chart.yaml`. Helm inlines it into a ConfigMap named `<release>-bigipreport-config` (`.Files.Get`). Swap it for your environment’s XML before install when you are not just trying the defaults. If you render directly from a sparse checkout, that file must still be present next to `Chart.yaml` or `helm template` / `helm install` will fail.

To get around this simply copy `data-collector/bigipreportconfig.xml` to `helm/bigipreportconfig.xml` in the repo.

## Install

```bash
helm install bigipreport <path-to-chart> -n bigipreport --create-namespace
helm upgrade bigipreport <path-to-chart> -n bigipreport
helm template bigipreport <path-to-chart>
```

## Configuration (`values.yaml`)

[`values.yaml`](values.yaml) only contains the knobs most installs need. Defaults for image tags come from [`Chart.yaml`](Chart.yaml) `appVersion` when `image.tag` is empty.

| Key | Description | Default |
|-----|-------------|---------|
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

**Fixed in templates (not in `values.yaml`):** Service listens on **port 80** (target frontend 8080); CronJob keeps `successfulJobsHistoryLimit` 1, `failedJobsHistoryLimit` 10, `startingDeadlineSeconds` 300.

Example override file:

```yaml
dataCollector:
  schedule: "0 * * * *"
  secret:
    name: my-team-bigip-credentials
  resources:
    requests:
      memory: 512Mi
      cpu: 250m
    limits:
      memory: 1Gi
      cpu: "1"
persistentStorage:
  size: 5Gi
  storageClassName: fast-ssd
```

## Advanced customization

The chart intentionally keeps [`values.yaml`](values.yaml) small. For anything below, use **`kubectl patch`**, a **Kustomize post-renderer**, **GitOps overlays**, or maintain a **fork** of the chart templates.

### Release naming (`nameOverride` / `fullnameOverride`)

The templates still honor Helm’s usual `.Values.nameOverride` and `.Values.fullnameOverride` if you supply them (they are not in the default `values.yaml`):

```bash
helm install myrel ./helm -n apps --set nameOverride=bir
```

See [`templates/_helpers.tpl`](templates/_helpers.tpl) for how names are composed.

### Private registry pulls (`imagePullSecrets`)

Add pull secrets on the rendered Deployment / CronJob pod specs, for example:

```bash
kubectl -n <namespace> patch deployment <release>-bigipreport-frontend --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/imagePullSecrets", "value":[{"name":"ghcr-login"}]}]'
```

Repeat for the CronJob’s pod template (`spec.jobTemplate.spec.template.spec.imagePullSecrets`) or use a post-renderer to inject consistently.

### `imagePullPolicy`

Patch the container `imagePullPolicy` similarly, or use a post-renderer / fork.

### Service port / annotations

**Port 80** (and `targetPort` `http`) stay in the chart template. Set **`frontend.service.type`** to `NodePort` or `LoadBalancer` when you need access outside the cluster. For a fixed `nodePort`, extra ports, or cloud annotations on the Service, patch the manifest or use a post-renderer / separate `Ingress`.

### Extra labels and annotations

Patch `metadata.labels` / `metadata.annotations` on Deployments, CronJobs, Pods, PVC, or ConfigMap as needed. If the same label must exist on **both** frontend and collector pods, apply both patches (or one Kustomize patch targeting multiple resources).

### NetworkPolicy

This chart **does not** ship a `NetworkPolicy` manifest. Add your own policy in GitOps or `kubectl apply -f` tailored to your namespace and ingress controller.

### CronJob history and deadlines

`successfulJobsHistoryLimit`, `failedJobsHistoryLimit`, and `startingDeadlineSeconds` are fixed in [`templates/data-collector.yaml`](templates/data-collector.yaml). Change them there or override with a post-renderer if you need different retention or scheduling behavior.

## Accessing the UI

The Service name is the Helm release full name (e.g. release `myrel` → Service `myrel-bigipreport`). Default **`frontend.service.type`** is `ClusterIP` on port 80. From inside the cluster: `http://<release>-bigipreport.<namespace>.svc.cluster.local`. With **`NodePort`** or **`LoadBalancer`**, use `kubectl get svc` for the assigned URL or port. For local testing without changing the Service type:

```bash
kubectl port-forward -n <namespace> svc/<release>-bigipreport 8080:80
```

Then open `http://localhost:8080`.

## Secrets and GitOps

Do not put F5 passwords in `values.yaml`. Prefer:

- A Secret created with `kubectl` or your platform’s secret UI, or
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets), [SOPS](https://github.com/getsops/sops), or [External Secrets](https://external-secrets.io/) so encrypted or externally sourced material never lives in plain values.

The chart only needs the **name** of the Secret (`dataCollector.secret.name`).

## Chart metadata

See [Chart.yaml](Chart.yaml) for chart `version` and application `appVersion` (default image tag when `image.tag` is empty).
