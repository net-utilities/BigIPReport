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
{{- if and .Values.ingress.enabled .Values.ingress.tls .Values.ingress.tlsSecretName }}
{{- $tlsName := .Values.ingress.tlsSecretName }}
{{- $tls := lookup "v1" "Secret" $ns $tlsName }}
{{- if not $tls }}
{{- fail (printf "validateResources: TLS Secret %q not found in namespace %q (ingress.tlsSecretName)" $tlsName $ns) }}
{{- end }}
{{- end }}
{{- end }}
{{- end -}}
