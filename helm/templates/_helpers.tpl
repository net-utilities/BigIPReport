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
