"""Stand-in for an external order system outside the cluster.

GET /orders returns a fixed list of orders as JSON; the system name in the
answer includes the port that served it. Listens on every port in PORTS, a comma-separated list of
ports and ranges (default "8081"), for example "8081,8101-8115".
"""

import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ORDERS = [
    {"id": 1001, "customer": "Muster GmbH", "amount": 1250.00},
    {"id": 1002, "customer": "Beispiel AG", "amount": 89.90},
    {"id": 1003, "customer": "Demo KG", "amount": 430.50},
]


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        port = self.server.server_address[1]
        if self.path == "/orders":
            body, status = json.dumps({"system": f"order-system (port {port})", "orders": ORDERS}).encode(), 200
        elif self.path == "/health":
            body, status = b'{"status":"ok"}', 200
        else:
            body, status = b'{"error":"not found"}', 404
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def parse_ports(spec: str) -> list[int]:
    ports = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            first, last = (int(p) for p in part.split("-", 1))
            ports.extend(range(first, last + 1))
        elif part:
            ports.append(int(part))
    return ports


if __name__ == "__main__":
    ports = parse_ports(os.environ.get("PORTS", os.environ.get("PORT", "8081")))
    servers = [ThreadingHTTPServer(("0.0.0.0", port), Handler) for port in ports]
    for server in servers[1:]:
        threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"order system listening on ports {', '.join(map(str, ports))}", flush=True)
    servers[0].serve_forever()
