{{- define "shop.name" -}}
{{- if not (has .Values.role (list "api" "frontend")) -}}
{{- fail (printf "role must be \"api\" or \"frontend\", got %q" .Values.role) -}}
{{- end -}}
{{ .Values.role }}
{{- end }}

{{- define "shop.selectorLabels" -}}
app.kubernetes.io/name: shop
app.kubernetes.io/component: {{ include "shop.name" . }}
{{- end }}

{{- define "shop.labels" -}}
{{ include "shop.selectorLabels" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}

{{/* Image reference; usage: include "shop.image" (dict "root" $ "image" .Values.api.image) */}}
{{- define "shop.image" -}}
{{- printf "%s/%s:%s" .root.Values.image.registry .image.name (.image.tag | default .root.Chart.AppVersion) }}
{{- end }}

{{- define "shop.apiUrl" -}}
{{- if .Values.frontend.apiUrl -}}
{{ .Values.frontend.apiUrl }}
{{- else -}}
{{ printf "http://api.%s.svc.cluster.local:8080" (regexReplaceAll "-frontend$" .Release.Namespace "-backend") }}
{{- end }}
{{- end }}

{{/*
Order system URL. Empty api.config.legacyUrl: in a namespace "p<NN>-..." the
order system port is 8100 + NN (p03-backend -> 8103), otherwise 8081.
*/}}
{{- define "shop.legacyUrl" -}}
{{- if .Values.api.config.legacyUrl -}}
{{ .Values.api.config.legacyUrl }}
{{- else -}}
{{- $port := 8081 -}}
{{- if regexMatch "^p[0-9]+-" .Release.Namespace -}}
{{- $port = add 8100 (atoi (regexReplaceAll "^p0*([0-9]+)-.*$" .Release.Namespace "${1}")) -}}
{{- end -}}
{{ printf "http://%s:%d" .Values.api.config.legacyHost (int $port) }}
{{- end -}}
{{- end }}

{{- define "shop.containerSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: ["ALL"]
{{- end }}
