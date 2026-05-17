{{/*
Expand the chart name, or the value of nameOverride if set.
*/}}
{{- define "bigipreport.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "bigipreport.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart label for helm.sh/chart
*/}}
{{- define "bigipreport.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels on all resources.
*/}}
{{- define "bigipreport.labels" -}}
helm.sh/chart: {{ include "bigipreport.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/name: {{ include "bigipreport.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end }}

{{/*
Labels used for Deployment selector, Service selector, and CronJob pod affinity (immutable on Deployment upgrades).
*/}}
{{- define "bigipreport.frontendSelectorLabels" -}}
app.kubernetes.io/name: {{ include "bigipreport.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
PVC name
*/}}
{{- define "bigipreport.pvcName" -}}
{{ include "bigipreport.fullname" . }}-pvc
{{- end }}

{{/*
ConfigMap name for bigipreportconfig.xml
*/}}
{{- define "bigipreport.configMapName" -}}
{{ include "bigipreport.fullname" . }}-config
{{- end }}

{{/*
Labels for data-collector pods (CronJob jobs).
*/}}
{{- define "bigipreport.dataCollectorSelectorLabels" -}}
app.kubernetes.io/name: {{ include "bigipreport.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: data-collector
{{- end }}

{{/*
TLS Secret created by cert-manager for this release (<release>-tls).
*/}}
{{- define "bigipreport.certManagerTlsSecretName" -}}
{{- printf "%s-tls" (include "bigipreport.fullname" .) }}
{{- end }}

{{/*
TLS Secret name for Ingress: cert-manager secret when issuing, else an existing tlsSecretName.
*/}}
{{- define "bigipreport.ingressTlsSecretName" -}}
{{- if .Values.ingress.certManager.enabled }}
{{- include "bigipreport.certManagerTlsSecretName" . }}
{{- else if .Values.ingress.tlsSecretName }}
{{- .Values.ingress.tlsSecretName }}
{{- end }}
{{- end }}

{{/*
Validate ingress TLS / cert-manager settings at render time.
*/}}
{{- define "bigipreport.validateIngressCertManager" -}}
{{- if .Values.ingress.certManager.enabled }}
{{- if not .Values.ingress.enabled }}
{{- fail "ingress.certManager.enabled requires ingress.enabled" }}
{{- end }}
{{- if not .Values.ingress.tls }}
{{- fail "ingress.certManager.enabled requires ingress.tls" }}
{{- end }}
{{- if .Values.ingress.tlsSecretName }}
{{- fail "ingress.tlsSecretName is for an existing TLS Secret only; leave empty when ingress.certManager.enabled" }}
{{- end }}
{{- if and .Values.ingress.certManager.clusterIssuer .Values.ingress.certManager.issuer }}
{{- fail "ingress.certManager: set clusterIssuer or issuer, not both" }}
{{- end }}
{{- if not (or .Values.ingress.certManager.clusterIssuer .Values.ingress.certManager.issuer) }}
{{- fail "ingress.certManager.enabled requires ingress.certManager.clusterIssuer or ingress.certManager.issuer" }}
{{- end }}
{{- else if and .Values.ingress.enabled .Values.ingress.tls (not .Values.ingress.tlsSecretName) }}
{{- fail "ingress.tls is true: set ingress.tlsSecretName to an existing Secret, or enable ingress.certManager" }}
{{- end }}
{{- end -}}

{{/*
Fail when egress.cilium.enabled without hosts.
*/}}
{{- define "bigipreport.validateCiliumEgress" -}}
{{- if and .Values.egress.cilium.enabled (not .Values.egress.cilium.hosts) }}
{{- fail "egress.cilium.hosts must list at least one host when egress.cilium.enabled is true" }}
{{- end }}
{{- end -}}

{{/*
Fail when egress.networkPolicy.enabled without cidrs.
*/}}
{{- define "bigipreport.validateNetworkPolicyEgress" -}}
{{- if and .Values.egress.networkPolicy.enabled (not .Values.egress.networkPolicy.cidrs) }}
{{- fail "egress.networkPolicy.cidrs must list at least one CIDR when egress.networkPolicy.enabled is true" }}
{{- end }}
{{- end -}}

{{/*
Fail when istio.serviceEntry.enabled without hosts.
*/}}
{{- define "bigipreport.validateIstioServiceEntry" -}}
{{- if and .Values.egress.istio.serviceEntry.enabled (not .Values.egress.istio.serviceEntry.hosts) }}
{{- fail "egress.istio.serviceEntry.hosts must list at least one host when egress.istio.serviceEntry.enabled is true" }}
{{- end }}
{{- end -}}

{{/*
Cilium toFQDNs entries from egress.cilium.hosts (string, matchName, or matchPattern).
*/}}
{{- define "bigipreport.ciliumToFQDNs" -}}
{{- range .Values.egress.cilium.hosts }}
{{- if kindIs "string" . }}
- matchName: {{ . | quote }}
{{- else if .matchName }}
- matchName: {{ .matchName | quote }}
{{- else if .matchPattern }}
- matchPattern: {{ .matchPattern | quote }}
{{- else }}
{{- fail "egress.cilium.hosts: each entry must be a hostname string or an object with matchName or matchPattern" }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
Host strings for Istio ServiceEntry (from egress.istio.serviceEntry.hosts).
*/}}
{{- define "bigipreport.istioServiceEntryHosts" -}}
{{- range .Values.egress.istio.serviceEntry.hosts }}
{{- if kindIs "string" . }}
- {{ . | quote }}
{{- else if .matchName }}
- {{ .matchName | quote }}
{{- else if .matchPattern }}
- {{ .matchPattern | quote }}
{{- else }}
{{- fail "egress.istio.serviceEntry.hosts: each entry must be a hostname string or an object with matchName or matchPattern" }}
{{- end }}
{{- end }}
{{- end -}}

{{/*
Kubernetes NetworkPolicy egress port list from egress.networkPolicy.ports.
*/}}
{{- define "bigipreport.networkPolicyPorts" -}}
{{- range .Values.egress.networkPolicy.ports }}
- protocol: {{ .protocol }}
  port: {{ .port }}
{{- end }}
{{- end -}}

{{/*
Container image ref. Empty .tag falls back to .appVersion (Chart.yaml appVersion).
*/}}
{{- define "bigipreport.image" -}}
{{- $repo := required "repository is required" .repository -}}
{{- $tag := .tag | default "" | toString -}}
{{- if eq $tag "" -}}
{{- $tag = required "appVersion is required when image tag is empty" .appVersion | toString -}}
{{- end -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end }}

{{/*
Pod/container securityContext for the frontend (defaults: UID/GID 101). Override via podSecurity.frontend.
*/}}
{{- define "bigipreport.frontendPodSecurityContext" -}}
{{- $ps := dict -}}
{{- if and .Values.podSecurity .Values.podSecurity.frontend }}{{- $ps = .Values.podSecurity.frontend }}{{- end }}
{{- include "bigipreport.restrictedPodSecurityContext" (dict "runAsUser" ($ps.runAsUser | default 101) "runAsGroup" ($ps.runAsGroup | default 101) "fsGroup" ($ps.fsGroup | default 101)) }}
{{- end }}

{{- define "bigipreport.frontendContainerSecurityContext" -}}
{{- $ps := dict -}}
{{- if and .Values.podSecurity .Values.podSecurity.frontend }}{{- $ps = .Values.podSecurity.frontend }}{{- end }}
{{- include "bigipreport.restrictedContainerSecurityContext" (dict "runAsUser" ($ps.runAsUser | default 101) "runAsGroup" ($ps.runAsGroup | default 101)) }}
{{- end }}

{{/*
Pod/container securityContext for the data collector (defaults: UID/GID 1000). Override via podSecurity.dataCollector.
*/}}
{{- define "bigipreport.dataCollectorPodSecurityContext" -}}
{{- $ps := dict -}}
{{- if and .Values.podSecurity .Values.podSecurity.dataCollector }}{{- $ps = .Values.podSecurity.dataCollector }}{{- end }}
{{- include "bigipreport.restrictedPodSecurityContext" (dict "runAsUser" ($ps.runAsUser | default 1000) "runAsGroup" ($ps.runAsGroup | default 1000) "fsGroup" ($ps.fsGroup | default 1000)) }}
{{- end }}

{{- define "bigipreport.dataCollectorContainerSecurityContext" -}}
{{- $ps := dict -}}
{{- if and .Values.podSecurity .Values.podSecurity.dataCollector }}{{- $ps = .Values.podSecurity.dataCollector }}{{- end }}
{{- include "bigipreport.restrictedContainerSecurityContext" (dict "runAsUser" ($ps.runAsUser | default 1000) "runAsGroup" ($ps.runAsGroup | default 1000)) }}
{{- end }}

{{/*
Least-privilege pod securityContext. Pass runAsUser (required); runAsGroup and fsGroup default to runAsUser.
*/}}
{{- define "bigipreport.restrictedPodSecurityContext" -}}
{{- $uid := required "runAsUser is required" .runAsUser -}}
{{- $gid := .runAsGroup | default $uid -}}
runAsNonRoot: true
runAsUser: {{ $uid }}
runAsGroup: {{ $gid }}
fsGroup: {{ .fsGroup | default $gid }}
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{/*
Least-privilege container securityContext.
*/}}
{{- define "bigipreport.restrictedContainerSecurityContext" -}}
{{- $uid := required "runAsUser is required" .runAsUser -}}
{{- $gid := .runAsGroup | default $uid -}}
allowPrivilegeEscalation: false
capabilities:
  drop:
    - ALL
readOnlyRootFilesystem: {{ .readOnlyRootFilesystem | default true }}
runAsNonRoot: true
runAsUser: {{ $uid }}
runAsGroup: {{ $gid }}
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{/*
Cluster-time checks for prerequisites (requires validateResources: true and a reachable API).
*/}}
{{- define "bigipreport.validatePrerequisites" -}}
{{- if .Values.validateResources }}
{{- $ns := .Release.Namespace }}
{{- $secretName := .Values.dataCollector.secret.name }}
{{- $secret := lookup "v1" "Secret" $ns $secretName }}
{{- if not $secret }}
{{- fail (printf "validateResources: Secret %q not found in namespace %q. Create it before install, for example:\n  kubectl create secret generic %s --from-literal=F5_USERNAME='…' --from-literal=F5_PASSWORD='…' -n %s" $secretName $ns $secretName $ns) }}
{{- end }}
{{- if not (hasKey $secret.data "F5_USERNAME") }}
{{- fail (printf "validateResources: Secret %q in namespace %q is missing required key F5_USERNAME" $secretName $ns) }}
{{- end }}
{{- if not (hasKey $secret.data "F5_PASSWORD") }}
{{- fail (printf "validateResources: Secret %q in namespace %q is missing required key F5_PASSWORD" $secretName $ns) }}
{{- end }}
{{- if .Values.config.existingConfigMap }}
{{- $cmName := .Values.config.existingConfigMap }}
{{- $cm := lookup "v1" "ConfigMap" $ns $cmName }}
{{- if not $cm }}
{{- fail (printf "validateResources: ConfigMap %q not found in namespace %q (config.existingConfigMap)" $cmName $ns) }}
{{- end }}
{{- if not (hasKey $cm.data "bigipreportconfig.xml") }}
{{- fail (printf "validateResources: ConfigMap %q must contain key bigipreportconfig.xml" $cmName) }}
{{- end }}
{{- end }}
{{- if and .Values.ingress.enabled .Values.ingress.tls (not .Values.ingress.certManager.enabled) }}
{{- $tlsName := include "bigipreport.ingressTlsSecretName" . }}
{{- if $tlsName }}
{{- $tls := lookup "v1" "Secret" $ns $tlsName }}
{{- if not $tls }}
{{- fail (printf "validateResources: TLS Secret %q not found in namespace %q (ingress.tlsSecretName)" $tlsName $ns) }}
{{- end }}
{{- end }}
{{- end }}
{{- end }}
{{- end -}}
