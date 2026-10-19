"""Stand-in for an external order system outside the cluster.

GET /orders returns a fixed list of orders as JSON. Listens on PORT (default 8081).
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ORDERS = {
    "system": "order-system",
    "orders": [
        {"id": 1001, "customer": "Muster GmbH", "amount": 1250.00},
        {"id": 1002, "customer": "Beispiel AG", "amount": 89.90},
        {"id": 1003, "customer": "Demo KG", "amount": 430.50},
    ],
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/orders":
            body, status = json.dumps(ORDERS).encode(), 200
        elif self.path == "/health":
            body, status = b'{"status":"ok"}', 200
        else:
            body, status = b'{"error":"not found"}', 404
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8081"))
    print(f"order system listening on port {port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
