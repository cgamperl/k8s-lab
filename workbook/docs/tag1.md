# Tag 1: Vom Container zu Kubernetes

## Hinweise zu den Übungen

<div class="warning custom-block xx-hint">
<p class="custom-block-title">Eigene Nummer eintragen</p>
<p>Oben in der Kopfzeile unter <strong>Nr.</strong> die eigene Teilnehmernummer eintragen. Die Seite setzt sie dann in alle Befehle und Werte ein, auch beim Kopieren. Ohne Eintrag sind <code>XX</code> selbst zu ersetzen: <code>pXX</code> wird z. B. zu <code>p07</code>, der Port <code>81XX</code> zu <code>8107</code>.</p>
</div>

- `XX` steht für die eigene Teilnehmernummer, zweistellig: Teilnehmer 7 verwendet `p07`, die Projects `p07-frontend` und `p07-backend` und den Port `8107`.
- Zugangsdaten werden zu Kursbeginn bekanntgegeben; das Passwort ist für alle Teilnehmer gleich. Benutzername und Passwort gelten für die OpenShift-Konsole und für Rancher.
- OpenShift-Konsole: https://console.a.openshift.tectrain.at
- Die Docker-Übungen laufen in Docker Desktop auf dem Schulungs-Laptop, die Befehle in PowerShell. Jede Befehlszeile wird als Ganzes eingegeben.
- Die Docker-Befehle und ihre Optionen sind im Anhang „Docker-Befehle“ erklärt.
- Images der Demo-Anwendung: `ghcr.io/cgamperl/k8s-lab/<name>:1.0.0` mit `<name>` = `api`, `frontend`, `legacy` (Bestellsystem), `log-sidecar`.

Die Demo-Anwendung „Shop“ besteht aus einem Frontend (Webseite), einer API und einem externen Bestellsystem. Das Frontend ruft die API auf, die API holt die Bestellungen aus dem Bestellsystem.

```
Browser ──► frontend ──/api/──► api ──► Bestellsystem
```

**Fallbeispiel:** Die Übungen folgen einem erfundenen Kunden, der Super Shop GmbH. Super Shop verkauft Haushaltswaren über den Shop; der Vertrieb meldet Störungen, der IT-Betrieb betreibt Cluster, Netzwerk und Firewall, das Bestellsystem steht im Rechenzentrum von Super Shop. Die Übungen werden aus der Sicht des Application Support beim Hersteller des Shops bearbeitet. Die Tickets `SHOP-…` stehen auf den Folien.

---

### Übung 1.1: Anmeldung an der OpenShift-Konsole

**Ziel:** Zugang prüfen und die eigenen Projects kennenlernen.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 10 min

**Schritte:**
1. In dieser Seite oben unter **Nr.** die eigene Teilnehmernummer eintragen.
2. https://console.a.openshift.tectrain.at öffnen. Falls eine Auswahl erscheint, „developer“ wählen.
3. Mit dem eigenen Benutzer `pXX` anmelden. Eine angebotene Einführungstour mit „Skip tour“ überspringen.
4. Links **Home → Projects** öffnen.
5. Links **Workloads → Topology** öffnen und oben im Feld **Project** nacheinander beide Projects auswählen.

**Erwartetes Ergebnis:** Genau zwei Projects sind sichtbar: `pXX-frontend` und `pXX-backend`. Die Topology beider Projects ist leer.

---

### Übung 1.2: Erster Container und ein externer Dienst

**Ziel:** Einen Container starten, seine Ausgabe lesen und ihn mit einem Dienst außerhalb des Containers verbinden.
**Umgebung:** Docker Desktop
**Dauer:** ca. 20 min
**Ticket:** SHOP-1001 · Die Images des Shops vor der Installation bei Super Shop lokal prüfen.

**Schritte:**
1. API ohne Konfiguration starten:
   ```powershell
   docker run --name api-test ghcr.io/cgamperl/k8s-lab/api:1.0.0
   ```
2. Die Ausgabe lesen. Mit `docker ps -a` den Status des Containers prüfen, danach `docker rm api-test`.
3. Das Bestellsystem als eigenen Container starten. Port 8081 des Laptops wird auf Port 8081 des Containers weitergeleitet:
   ```powershell
   docker run -d --name legacy -p 8081:8081 ghcr.io/cgamperl/k8s-lab/legacy:1.0.0
   ```
4. Im Browser http://localhost:8081/orders öffnen.
5. API mit der Adresse des Bestellsystems starten. `host.docker.internal` ist in Docker Desktop der Name des Laptops aus Sicht eines Containers:
   ```powershell
   docker run -d --name api -p 8090:8080 -e LEGACY_URL=http://host.docker.internal:8081 ghcr.io/cgamperl/k8s-lab/api:1.0.0
   ```
6. Im Browser http://localhost:8090/orders öffnen.
7. Logs der API anzeigen: `docker logs api`.

**Erwartetes Ergebnis:** Schritt 1 endet sofort mit `FATAL: required environment variable LEGACY_URL is not set`, der Container hat den Status `Exited`. Nach Schritt 6 zeigt der Browser drei Bestellungen als JSON. Das Log enthält eine Zeile pro Aufruf (`GET /orders … 200 OK`).

**Zusatz:** Das Bestellsystem mit `docker stop legacy` anhalten und http://localhost:8090/orders erneut aufrufen. Welche Meldung liefert die API, und was steht im Log? Danach `docker start legacy`.

---

### Übung 1.3: Das Container-Dateisystem

**Ziel:** Nachvollziehen, wo Änderungen in einem Container landen und was davon übrig bleibt.
**Umgebung:** Docker Desktop
**Dauer:** ca. 15 min

Das Image `api` wurde aus diesem Containerfile gebaut (gleiches Format wie ein Dockerfile):

```dockerfile
FROM docker.io/library/python:3.12-slim

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    LOG_FILE=/var/log/app/api.log

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
# The log directory is normally an emptyDir volume; group 0 makes it writable
# for the arbitrary UID that OpenShift assigns.
RUN mkdir -p /var/log/app && chgrp -R 0 /var/log/app && chmod -R g=u /var/log/app

USER 1001
EXPOSE 8080
CMD ["python", "app.py"]
```

Die Übung prüft im laufenden Container, was die Zeilen `WORKDIR`/`COPY`, `RUN mkdir … chgrp …` und `USER 1001` bewirken.

**Schritte:**
1. Eine Shell im laufenden Container `api` öffnen. Die Eingabeaufforderung wechselt zu `$`; alle folgenden Befehle bis `exit` laufen im Container:
   ```powershell
   docker exec -it api sh
   ```
2. Im Container den Benutzer, das Arbeitsverzeichnis und den Rechnernamen anzeigen:
   ```sh
   id
   pwd
   ls
   hostname
   ```
3. Im Container Dateien anlegen und lesen:
   ```sh
   echo note > /tmp/note.txt
   cat /tmp/note.txt
   echo note > /app/note.txt
   ls -ld /app /var/log/app
   ls /var/log/app
   ```
4. Die Shell mit `exit` verlassen. Auf dem Laptop mit `docker ps` den Rechnernamen aus Schritt 2 mit der Container-ID vergleichen.
5. Änderungen gegenüber dem Image anzeigen: `docker diff api`.
6. Container entfernen, neu starten und die Datei erneut lesen:
   ```powershell
   docker rm -f api
   docker run -d --name api -p 8090:8080 -e LEGACY_URL=http://host.docker.internal:8081 ghcr.io/cgamperl/k8s-lab/api:1.0.0
   docker exec api cat /tmp/note.txt
   ```
7. Die Schichten des Images anzeigen: `docker history ghcr.io/cgamperl/k8s-lab/api:1.0.0`.
8. Die Metadaten des Images anzeigen:
   ```powershell
   docker image inspect ghcr.io/cgamperl/k8s-lab/api:1.0.0 --format "User={{.Config.User}} Ports={{.Config.ExposedPorts}} Cmd={{.Config.Cmd}}"
   ```

**Erwartetes Ergebnis:** `id` zeigt `uid=1001 gid=0(root)`, das Arbeitsverzeichnis ist `/app` mit `app.py`. Der Rechnername ist der Anfang der Container-ID. `/tmp/note.txt` lässt sich anlegen, `/app/note.txt` nicht (`Permission denied`): Der Prozess läuft nicht als root und darf nur in freigegebene Verzeichnisse schreiben: `/app` ist nur für den Besitzer root beschreibbar (`drwxr-xr-x`), `/var/log/app` auch für die Gruppe root (`drwxrwxr-x`), der der Benutzer 1001 angehört. Das sind die Zeilen `USER 1001` und `chgrp -R 0 … chmod -R g=u` des Containerfiles. In `/var/log/app` liegt die Logdatei `api.log` der API. `docker diff` listet `/tmp/note.txt` und `/var/log/app/api.log` als hinzugefügt (`A`). Im neuen Container existiert die Datei nicht mehr. `docker history` zeigt die Anweisungen, aus denen das Image gebaut wurde, mit `USER 1001`, `EXPOSE 8080` und `CMD ["python" "app.py"]`.

---

### Übung 1.4: Volumes und ein zweiter Container

**Ziel:** Daten über ein Volume zwischen zwei Containern teilen.
**Umgebung:** Docker Desktop
**Dauer:** ca. 15 min

**Schritte:**
1. Den Container `api` entfernen: `docker rm -f api`.
2. API mit einem benannten Volume für ihr Log-Verzeichnis starten:
   ```powershell
   docker run -d --name api -p 8090:8080 -e LEGACY_URL=http://host.docker.internal:8081 -v api-logs:/var/log/app ghcr.io/cgamperl/k8s-lab/api:1.0.0
   ```
3. Einen zweiten Container starten, der dasselbe Volume einbindet und die Logdatei ausgibt:
   ```powershell
   docker run -d --name log-sidecar -v api-logs:/var/log/app ghcr.io/cgamperl/k8s-lab/log-sidecar:1.0.0
   ```
4. http://localhost:8090/orders einige Male aufrufen.
5. `docker logs api` und `docker logs log-sidecar` vergleichen.
6. Aufräumen: `docker rm -f api log-sidecar legacy` und `docker volume rm api-logs`.

**Erwartetes Ergebnis:** `docker logs api` zeigt nur Zugriffe (`GET /orders`). `docker logs log-sidecar` zeigt die Anwendungsmeldungen aus der Datei `api.log`, z. B. `starting on …` und `served 3 orders`.

**Zusatz:** Vor dem Aufräumen in Schritt 6 die API mit einem Verzeichnis des Laptops statt eines benannten Volumes starten (Bind Mount):
```powershell
docker rm -f api
docker run -d --name api -p 8090:8080 -e LEGACY_URL=http://host.docker.internal:8081 -v ${PWD}\logs:/var/log/app ghcr.io/cgamperl/k8s-lab/api:1.0.0
```
Docker legt den Ordner `logs` im aktuellen Verzeichnis an. Darin liegt danach die Datei `api.log`, die sich mit einem Editor öffnen lässt.

---

### Übung 1.5: Die ganze Anwendung mit Docker Compose

**Ziel:** Mehrere Container gemeinsam beschreiben und starten; Lastverteilung zwischen zwei Instanzen beobachten.
**Umgebung:** Docker Desktop
**Dauer:** ca. 25 min

**Schritte:**
1. Einen Ordner `shop` anlegen und darin die Datei `compose.yaml` mit diesem Inhalt speichern:
   ```yaml
   services:
     legacy:
       image: ghcr.io/cgamperl/k8s-lab/legacy:1.0.0
     api:
       image: ghcr.io/cgamperl/k8s-lab/api:1.0.0
       environment:
         LEGACY_URL: http://legacy:8081
       volumes:
         - logs:/var/log/app
     log-sidecar:
       image: ghcr.io/cgamperl/k8s-lab/log-sidecar:1.0.0
       volumes:
         - logs:/var/log/app
     web:
       image: ghcr.io/cgamperl/k8s-lab/frontend:1.0.0
       environment:
         API_URL: http://api:8080
       ports:
         - "8090:8080"
   volumes:
     logs:
   ```
2. Im Ordner `shop`: `docker compose up -d`, danach `docker compose ps`.
3. http://localhost:8090 öffnen. Die Seite zeigt die Bestellungen und, welche API-Instanz geantwortet hat.
4. Zwei API-Instanzen starten: `docker compose up -d --scale api=2`.
5. Die Seite mehrmals neu laden und die angezeigte API-Instanz beobachten.
6. Aufräumen: `docker compose down -v`.

**Erwartetes Ergebnis:** Vier Container laufen (nach Schritt 4 fünf). Die Seite zeigt drei Bestellungen. Nach Schritt 4 wechselt die angezeigte API-Instanz zwischen zwei Werten.

**Fragen zur Diskussion:** Wie findet das Frontend die API? Was passiert, wenn der Laptop ausfällt?

---

### Übung 1.6: Die API im Cluster starten

**Ziel:** Ein Image als Deployment in OpenShift starten, einen Fehler am Pod erkennen und über eine Umgebungsvariable beheben.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 20 min
**Ticket:** SHOP-1003 · Die Bestell-API im Cluster von Super Shop starten.

**Schritte:**
1. Oben im Feld **Project** das Project `pXX-backend` wählen. Erst danach oben rechts auf **+** klicken und **Container images** wählen. Die Konsole prüft das Image im oben gewählten Project; steht dort `default`, erscheint die Meldung `imagestreamimports … is forbidden`.
2. **Image name from external registry:** `ghcr.io/cgamperl/k8s-lab/api:1.0.0`. Warten, bis das Image erkannt wurde.
3. **Application name:** `shop`, **Name:** `api`.
4. Das Häkchen bei **Create a route** entfernen. Auf **Create** klicken.
5. In der Topology den Kreis `api` anklicken und den Status beobachten.
6. Rechts in der Seitenleiste, Reiter **Resources**, beim Pod auf **View logs** klicken.
7. Links **Workloads → Deployments → api** öffnen, Reiter **Environment**. Eine Variable `LEGACY_URL` mit dem Wert `http://192.168.130.1:81XX` hinzufügen (für `p07`: `8107`) und **Save**. <span class="xx-hint"><code>XX</code> durch die eigene Nummer ersetzen.</span>
8. Zurück in der Topology den Kreis `api` beobachten.

**Erwartetes Ergebnis:** Nach Schritt 4 startet der Pod und stürzt wiederholt ab: Der Status wechselt zwischen `Error` und `CrashLoopBackOff`, der Ring um den Kreis ist dunkel. Das Log zeigt `FATAL: required environment variable LEGACY_URL is not set`. Nach Schritt 7 entsteht ein neuer Pod mit dem Status `Running`, der Ring wird blau.

**Hinweis:** Das Formular legt neben dem Deployment einen Service und einen **ImageStream** `api` an. Ein ImageStream ist ein OpenShift-eigener Verweis auf ein Image (kein Kubernetes-Standard). Ändert sich das Image hinter dem Verweis, kann OpenShift das Deployment automatisch neu ausrollen (Image-Trigger). Helm-Charts an Tag 2 verwenden keine ImageStreams; ihre Deployments nennen das Image direkt.

---

### Übung 1.7: Einen Pod untersuchen

**Ziel:** Die Ansichten eines Pods kennenlernen und den Container von innen betrachten.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. **Workloads → Pods**, Project `pXX-backend`, den Pod `api-…` öffnen.
2. Nacheinander die Reiter **Details**, **Metrics**, **YAML**, **Environment**, **Logs**, **Events** ansehen.
3. Reiter **Terminal** öffnen und eingeben:
   ```sh
   id
   env | grep LEGACY
   cat /etc/resolv.conf
   ```
4. Im Reiter **YAML** die Abschnitte `resources` und `securityContext` des Containers suchen.

**Erwartetes Ergebnis:** `id` zeigt eine hohe, zufällige Benutzer-ID (z. B. `uid=1001050000`) und `gid=0(root)`, nicht `1001` wie in Docker. Die Gruppe 0 bleibt; deshalb kann die API in `/var/log/app` schreiben, das laut Containerfile für die Gruppe 0 beschreibbar ist (Übung 1.3). `resources` enthält Werte, obwohl keine angegeben wurden; sie stammen aus der Vorgabe des Projects. `resolv.conf` enthält eine Zeile `search pXX-backend.svc.cluster.local …`.

---

### Übung 1.8: Skalieren und Selbstheilung

**Ziel:** Beobachten, wie ein Deployment die gewünschte Anzahl Pods herstellt.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. **Workloads → Deployments → api**, Reiter **Details**. Mit dem Pfeil nach oben neben dem Kreis auf 3 Pods erhöhen.
2. Reiter **Pods**: die drei Pods und ihre Namen notieren.
3. Einen der Pods öffnen und über **Actions → Delete Pod** löschen.
4. Zurück zum Deployment, Reiter **Pods**, sofort und nach einigen Sekunden ansehen.
5. Reiter **ReplicaSets** öffnen.

**Erwartetes Ergebnis:** Nach dem Löschen erscheint sofort ein neuer Pod mit neuem Namen. Die Pod-Namen beginnen alle mit demselben Teil (`api-<hash>-`), der dem Namen des ReplicaSets entspricht. Unter ReplicaSets stehen zwei Einträge: eines aus Übung 1.6 vor der Änderung der Umgebungsvariable mit 0 Pods, eines mit 3 Pods.

---

### Übung 1.9: Das Frontend mit einer Route

**Ziel:** Die Anwendung über zwei Projects verbinden und von außen erreichbar machen.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 20 min
**Ticket:** SHOP-1004 · Den Shop unter einer Adresse erreichbar machen.

**Schritte:**
1. Oben im Feld **Project** das Project `pXX-frontend` wählen, dann **+ → Container images**.
2. **Image name from external registry:** `ghcr.io/cgamperl/k8s-lab/frontend:1.0.0`.
3. **Application name:** `shop`, **Name:** `frontend`.
4. **Show advanced Deployment option** aufklappen und eine Umgebungsvariable `API_URL` mit dem Wert `http://api.pXX-backend.svc.cluster.local:8080` eintragen. <span class="xx-hint"><code>XX</code> durch die eigene Nummer ersetzen.</span>
5. **Create a route** bleibt angehakt. **Create**.
6. In der Topology am Kreis `frontend` das Symbol für die Route (Pfeil nach rechts oben) anklicken.
7. Die Seite mehrmals neu laden und die angezeigte API-Instanz beobachten.

**Erwartetes Ergebnis:** Die Seite unter `https://frontend-pXX-frontend.apps.a.openshift.tectrain.at` öffnet ohne Zertifikatswarnung und zeigt drei Bestellungen. Die angezeigte API-Instanz wechselt zwischen den drei API-Pods.

---

### Übung 1.10: Service, Endpoints und Labels

**Ziel:** Nachvollziehen, wie ein Service seine Pods findet.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. **Networking → Services → api** (Project `pXX-backend`). Im Reiter **Details** den **Pod selector** notieren, rechts unter **Service port mapping** die Spalten **Port** und **Pod port or name**. „Pod port or name“ ist der Port im Container, an den der Service weiterleitet (`targetPort` im YAML). Danach den Reiter **Pods** öffnen.
2. **Networking → Routes → frontend** (Project `pXX-frontend`): Ziel-Service und Location notieren.
3. Einen der API-Pods öffnen und über **Actions → Edit labels** das Label `app=api` entfernen. **Save**.
4. Erneut den Reiter **Pods** des Service `api` und die Pod-Liste des Projects ansehen.
5. Den Pod ohne Label über **Actions → Delete Pod** löschen.

**Erwartetes Ergebnis:** Der Service wählt seine Pods über den Selector `app=api, deployment=api`; ein Pod gehört nur dazu, wenn er beide Labels trägt. Er leitet Port 8080 auf Port 8080 der Container. Nach Schritt 3 gehört der Pod nicht mehr zum Service und nicht mehr zum ReplicaSet: Der Service zeigt drei andere Pods, das ReplicaSet hat einen Ersatz gestartet, und im Project laufen vier API-Pods.

---

### Übung 1.11: Namen zwischen Namespaces

**Ziel:** Feststellen, unter welchen Namen ein Service aus einem anderen Namespace erreichbar ist.
**Umgebung:** OpenShift-Konsole (Pod-Terminal)
**Dauer:** ca. 10 min

**Schritte:**
1. Im Project `pXX-frontend` den Pod `frontend-…` öffnen, Reiter **Terminal**.
2. Nacheinander eingeben. <span class="xx-hint"><code>XX</code> durch die eigene Nummer ersetzen.</span>
   ```sh
   curl -s -m 5 http://api:8080/orders
   curl -s -m 5 http://api.pXX-backend:8080/orders
   curl -s -m 5 http://api.pXX-backend.svc.cluster.local:8080/orders
   ```

**Erwartetes Ergebnis:** Der erste Aufruf liefert keine Bestellungen. Der zweite und dritte liefern die Bestellungen als JSON.

---

### Übung 1.12: Vom Laptop in den Cluster

**Ziel:** Eine Anwendung im Cluster aus einem Container außerhalb des Clusters aufrufen.
**Umgebung:** Docker Desktop
**Dauer:** ca. 10 min

**Schritte:**
1. Einen Container starten, der die Route der eigenen Anwendung aufruft. <span class="xx-hint"><code>XX</code> durch die eigene Nummer ersetzen.</span>
   ```powershell
   docker run --rm ghcr.io/cgamperl/k8s-lab/frontend:1.0.0 curl -s https://frontend-pXX-frontend.apps.a.openshift.tectrain.at/api/orders
   ```
2. Diskutieren: Welche Angaben braucht die IT, damit dieser Aufruf aus einem Firmennetz funktioniert? Was wäre nötig, damit umgekehrt eine Anwendung im Cluster einen Dienst auf dem Laptop aufrufen kann?

**Erwartetes Ergebnis:** Die Antwort enthält die Bestellungen als JSON. Der Weg vom Laptop in den Cluster führt über HTTPS auf Port 443 des Routers; der umgekehrte Weg ist nicht möglich, weil der Laptop von außen nicht erreichbar ist.

**Weg der Anfrage:**

```text
Laptop: Container mit curl
  │  1. DNS: frontend-pXX-frontend.apps.a.openshift.tectrain.at → öffentliche Adresse
  │  2. HTTPS, Port 443, durch Firmennetz und Proxy
  ▼
Load Balancer vor dem Cluster
  ▼
Router (OpenShift)            3. Zertifikat *.apps.a.openshift.tectrain.at, TLS endet hier
  │                           4. Hostname → Route frontend
  ▼
Service frontend → Pod frontend (nginx)
  │                           5. /api/orders → /orders an API_URL
  ▼
Service api (pXX-backend) → Pod api → Bestellsystem
```

Jede Nummer ist eine Stelle, an der die Anfrage scheitern kann: 1 Name nicht auflösbar, 2 Firewall oder Proxy sperrt, 3 Zertifikatswarnung, 4 keine passende Route (Fehlerseite des Routers), 5 Seite lädt, aber die Bestellungen fehlen (`API_URL`, Service ohne Endpoints).

---

### Übung 1.13 (Zusatz): Ein Image aus Docker Hub

**Ziel:** Ein Image starten, das unter Docker funktioniert, und das Verhalten in OpenShift vergleichen.
**Umgebung:** Docker Desktop, OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. Lokal: `docker run --rm -d --name nginx -p 8095:80 nginx:1.27-alpine`, http://localhost:8095 öffnen, danach `docker rm -f nginx`.
2. In OpenShift: oben im Feld **Project** das Project `pXX-frontend` wählen, dann **+ → Container images**, Image `docker.io/library/nginx:1.27-alpine`, **Application name:** `test`, **Name:** `nginx`, **Create a route** abwählen, **Create**.
3. Status und Logs des Pods ansehen.
4. Die Anwendung `test` wieder löschen (siehe Übung 1.14).

**Erwartetes Ergebnis:** Lokal zeigt der Browser die nginx-Startseite. In OpenShift endet der Pod mit einem Fehler; das Log enthält `mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)`.

---

### Übung 1.14: Aufräumen

**Ziel:** Die Projects für Tag 2 leeren.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 5 min

**Schritte:**
1. Topology des Projects `pXX-frontend` öffnen.
2. Mit der rechten Maustaste auf den Rahmen der Anwendung `shop` klicken und **Delete application** wählen. Zur Bestätigung `shop` eintippen und **Delete**.
3. Dasselbe im Project `pXX-backend`.

**Erwartetes Ergebnis:** Die Topology beider Projects ist leer; Deployments, Services und Routes der Anwendung sind gelöscht.
