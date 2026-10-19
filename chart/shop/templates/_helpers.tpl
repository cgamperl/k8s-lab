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

{{- define "shop.containerSecurityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: ["ALL"]
{{- end }}
