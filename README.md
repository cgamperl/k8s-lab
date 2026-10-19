# k8s-lab

A small demo application for Kubernetes and OpenShift exercises: a web frontend,
an order API with a log sidecar, and a stand-in for an external order system.

| Component | Image | Purpose |
|---|---|---|
| frontend | `ghcr.io/cgamperl/k8s-lab/frontend` | nginx (unprivileged) serving a page that polls the API through `/api/`. Shows the frontend and API versions and the API pod that answered. |
| api | `ghcr.io/cgamperl/k8s-lab/api` | FastAPI service: `/health`, `/ready`, `/orders`. Reads `LEGACY_URL` and `DISCOUNT_RATE`, writes its application log to `/var/log/app/api.log`. |
| log-sidecar | `ghcr.io/cgamperl/k8s-lab/log-sidecar` | Follows the API's log file and prints it to standard output. |
| legacy | `ghcr.io/cgamperl/k8s-lab/legacy` | External order system outside the cluster; `GET /orders` on every port in `PORTS` (default 8081). |

All images run as an arbitrary non-root UID (OpenShift `restricted-v2`).

## Helm chart

```bash
helm repo add lab https://cgamperl.github.io/k8s-lab/
helm install api lab/shop -n <name>-backend
helm install web lab/shop -n <name>-frontend --set role=frontend
```

One chart deploys either component (`role: api` or `role: frontend`). The frontend
reaches the API at `http://api.<name>-backend.svc.cluster.local:8080` unless
`frontend.apiUrl` is set. `exposure.type` selects an OpenShift Route (default),
a Kubernetes Ingress, or no external access. See `chart/shop/values.yaml` for all settings.

The external order system runs outside the cluster and can serve one port per
team, so that a firewall rule can affect a single team:

```bash
podman run -d --name legacy --network host -e PORTS=8081,8101-8115 ghcr.io/cgamperl/k8s-lab/legacy:1.1.0
```

Unless `api.config.legacyUrl` is set, the API release uses
`http://<api.config.legacyHost>:<port>`, with port 8100 + NN in a namespace named
`p<NN>-...` (for example `p03-backend` → 8103) and 8081 otherwise.

Published image tags are not rebuilt: the image workflow only builds tags that
do not exist yet, unless it is started manually with `rebuild: true`.

## Repository layout

- `app/`: sources and Containerfiles of the images, built by `.github/workflows/images.yaml`
- `chart/shop/`: the Helm chart
- branch `gh-pages`: the published Helm repository (`index.yaml` and chart packages)
