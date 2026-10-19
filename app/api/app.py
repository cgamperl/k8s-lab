"""Order API of the shop demo application.

Configuration (environment variables):
  LEGACY_URL     base URL of the external order system (required)
  DISCOUNT_RATE  discount applied to order totals, as a fraction (default 0)
  LOG_FILE       application log file; read by the log-sidecar container
  APP_VERSION    version string reported by the API (set at image build time)
  PORT           listen port (default 8080)

Application events are written to LOG_FILE only. Standard output carries the
HTTP access log.
"""

import json
import logging
import os
import socket
import sys
import urllib.error
import urllib.request

import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse

VERSION = os.environ.get("APP_VERSION", "dev")
HOSTNAME = socket.gethostname()
LEGACY_TIMEOUT_SECONDS = 3

log = logging.getLogger("shop.api")
app = FastAPI(title="shop-api", version=VERSION)


def configure_logging() -> None:
    log_file = os.environ.get("LOG_FILE")
    handler = logging.FileHandler(log_file) if log_file else logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(handler)
    log.setLevel(logging.INFO)


def legacy_url() -> str:
    return os.environ["LEGACY_URL"].rstrip("/")


def discount_rate() -> float:
    raw = os.environ.get("DISCOUNT_RATE", "0")
    try:
        rate = float(raw)
    except ValueError as err:
        raise ValueError(f"DISCOUNT_RATE must be a number between 0 and 1, got {raw!r}") from err
    if not 0 <= rate <= 1:
        raise ValueError(f"DISCOUNT_RATE must be between 0 and 1, got {raw!r}")
    return rate


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    return {"status": "ready"}


@app.get("/orders")
def orders():
    base = {"api_version": VERSION, "api_pod": HOSTNAME}
    url = f"{legacy_url()}/orders"
    try:
        with urllib.request.urlopen(url, timeout=LEGACY_TIMEOUT_SECONDS) as resp:
            legacy = json.load(resp)
    except (urllib.error.URLError, TimeoutError, OSError) as err:
        reason = getattr(err, "reason", err)
        log.error("order system %s not reachable: %s", url, reason)
        return JSONResponse(
            status_code=502,
            content={**base, "error": f"order system {url} not reachable: {reason}"},
        )

    try:
        rate = discount_rate()
        items = [
            {**order, "total": round(order["amount"] * (1 - rate), 2)}
            for order in legacy["orders"]
        ]
    except Exception:
        log.exception("failed to process orders")
        return JSONResponse(status_code=500, content={**base, "error": "internal error"})

    log.info("served %d orders", len(items))
    return {**base, "source": legacy.get("system", "unknown"), "orders": items}


def main() -> None:
    configure_logging()
    if not os.environ.get("LEGACY_URL"):
        print("FATAL: required environment variable LEGACY_URL is not set", file=sys.stderr, flush=True)
        sys.exit(1)
    log.info("shop-api %s starting on %s, order system %s", VERSION, HOSTNAME, legacy_url())
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8080")), log_level="info")


if __name__ == "__main__":
    main()
