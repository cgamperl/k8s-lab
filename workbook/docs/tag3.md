# Tag 3: Netzwerk, externe Systeme, Rancher, Challenge

`XX` steht für die eigene Teilnehmernummer. Zu Beginn läuft die Anwendung `shop` aus Tag 2 in beiden Projects in OpenShift; Rancher-Projects sind leer.

::: warning Eigene Nummer einsetzen
Befehle und Werte mit `XX` vor dem Ausführen anpassen: `pXX` wird z. B. zu `p07`, der Port `81XX` zu `8107`. Kopierte Befehle enthalten noch `XX`.
:::

**Fallbeispiel:** Nach einer Netzwerkwartung bei der Super Shop GmbH treten Störungen auf, deren Ursache nicht im Release liegt. Am Nachmittag kommt das Logistikzentrum von Super Shop hinzu, das Kubernetes mit Rancher betreibt. Zum Abschluss hat der Support Bereitschaft an einem Aktionstag.

**Vorbereitung im Web Terminal** (das Terminal verliert nach längerer Inaktivität seine Dateien und Repositories):
```sh
helm repo add lab https://cgamperl.github.io/k8s-lab/
echo "role: frontend" > web-values.yaml
```

---

### Übungen 3.1–3.3: Netzwerk-Szenarien

**Ticket:** SHOP-1030 · Seit der Netzwerkwartung am Wochenende ist der Shop zeitweise gestört.

Der Trainer bringt die Anwendung aller Teilnehmer in einen fehlerhaften Zustand, wie an Tag 2. Diesmal liegt die Ursache auf dem Weg einer Anfrage. Vorgehen:

1. Symptom feststellen: Was zeigt die Seite, was zeigt `/api/orders`? Welcher HTTP-Statuscode, und wer antwortet (Router, Frontend, API)?
2. Den Weg prüfen: Route → Service → Endpoints → Pod → Aufruf zur API → externes System.
3. Jedes Glied einzeln testen. `oc` steht nur im Web Terminal zur Verfügung; `curl` und `getent` auch im Terminal eines Pods (Konsole: Pod → Terminal), das die Sicht des jeweiligen Pods hat. Die Konsole zeigt dieselben Objekte unter **Networking**.
4. Ursache benennen, beheben, prüfen, Protokoll ausfüllen.

| Szenario | Symptom (Statuscode, wer antwortet) | Wo gefunden | Ursache | Behebung |
|---|---|---|---|---|
| 3.1 | | | | |
| 3.2 | | | | |
| 3.3 | | | | |

**Dauer:** ca. 15–20 min je Szenario.

---

### Übung 3.4: Ein externes System ist nicht erreichbar

**Ziel:** Eine Ursache außerhalb des Clusters erkennen und eingrenzen.
**Umgebung:** OpenShift-Konsole, Web Terminal
**Dauer:** ca. 20 min
**Ticket:** SHOP-1031 · Der Shop zeigt keine Bestellungen, das Bestellsystem läuft laut IT-Betrieb.

**Schritte:**
1. Symptom auf der Seite und unter `/api/orders` feststellen.
2. Pods, Services und Endpoints prüfen.
3. Das Log der API über den Sidecar lesen.
4. Die Adresse des Bestellsystems aus der ConfigMap `api-config` im Project `pXX-backend` ermitteln.
5. Aus dem Web Terminal (Project `pXX-backend`) das Bestellsystem direkt aufrufen. `XX` durch die eigene Nummer ersetzen.
   ```sh
   curl -sv -m 5 http://192.168.130.1:81XX/orders
   ```
6. Zum Vergleich einen anderen Port desselben Systems aufrufen: `curl -s -m 5 -o /dev/null -w "%{http_code}\n" http://192.168.130.1:8081/orders`.

**Erwartetes Ergebnis:** Alle Objekte im Cluster sind fehlerfrei. Der eigene Port des Bestellsystems weist die Verbindung ab, der Vergleichsport antwortet. Die Ursache liegt außerhalb des Clusters.

---

### Übung 3.5: Eine Anfrage an die IT formulieren

**Ziel:** Für eine Firewall-Freigabe alle nötigen Angaben zusammenstellen.
**Umgebung:** Workbook
**Dauer:** ca. 10 min

**Schritte:** Für den Fall aus 3.4 eine Anfrage an die zuständige IT schreiben, die ohne Rückfrage bearbeitet werden kann.

| Angabe | Wert |
|---|---|
| Quelle (wer baut die Verbindung auf) | |
| Ziel (Adresse oder Hostname) | |
| Port und Protokoll | |
| Richtung | |
| Beobachtung und Zeitpunkt | |
| Nachweis (Befehl und Ausgabe) | |

**Erwartetes Ergebnis:** Eine Anfrage, die Quelle, Ziel, Port, Protokoll und Richtung nennt und mit der Ausgabe von `curl` belegt, dass die Verbindung abgewiesen wird.

---

### Übung 3.6: Welcher Pod antwortet?

**Ziel:** Die Verteilung von Anfragen auf mehrere Pods beobachten und erkennen, wann sie nicht stattfindet.
**Umgebung:** Web Terminal, OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. Im Web Terminal mehrere Anfragen an die API senden und den antwortenden Pod ausgeben. `XX` durch die eigene Nummer ersetzen.
   ```sh
   for i in 1 2 3 4 5 6 7 8; do curl -s http://api.pXX-backend:8080/orders | jq -r .api_pod; done
   ```
2. Die API auf 3 Pods skalieren (Konsole: Deployment `api`, Pfeil nach oben) und Schritt 1 wiederholen.
3. Bei einem der API-Pods über **Actions → Edit labels** das Label `app.kubernetes.io/component=api` entfernen. Schritt 1 wiederholen und die Endpoints des Service `api` ansehen.
4. Den Pod ohne Label löschen und die API wieder auf 2 Pods stellen.

**Erwartetes Ergebnis:** Die Antworten verteilen sich auf alle bereiten Pods. Der Pod ohne Label erscheint nicht mehr in den Antworten und nicht mehr in den Endpoints.

**Frage zur Diskussion:** Woran wäre zu erkennen, dass einer von drei Pods fehlerhaft antwortet, obwohl er als bereit gilt?

---

### Übung 3.7: Anmeldung an Rancher

**Ziel:** Die Rancher-Oberfläche kennenlernen.
**Umgebung:** Rancher
**Dauer:** ca. 10 min
**Ticket:** SHOP-1040 · Den Shop im Logistikzentrum installieren.

**Schritte:**
1. https://rancher.k8s.tectrain.at öffnen, **Log in with Local User**, Benutzer `pXX` mit demselben Passwort wie in OpenShift.
2. Den Cluster `local` öffnen.
3. **Cluster → Projects/Namespaces** ansehen.
4. Die Menüpunkte **Workloads**, **Apps**, **Service Discovery**, **Storage**, **Policy** aufklappen.

**Erwartetes Ergebnis:** Sichtbar ist nur das Project `pXX` mit den Namespaces `pXX-frontend` und `pXX-backend`. Beide sind leer.

---

### Übung 3.8: Die Anwendung über Apps installieren

**Ziel:** Das bekannte Chart in Rancher installieren.
**Umgebung:** Rancher
**Dauer:** ca. 20 min

**Schritte:**
1. **Apps → Charts**. Links unter **Repository** nur `k8s-lab` auswählen. Die Kachel **shop** öffnen.
2. **Install**. Namespace `pXX-backend`, Name `api`, Chart-Version `1.0.0`. **Next**, die Werte unverändert lassen, **Install**.
3. Den Fortschritt im unteren Fenster verfolgen, bis die Ausgabe endet.
4. Erneut installieren: Namespace `pXX-frontend`, Name `web`. Im YAML-Editor `role: api` in `role: frontend` ändern. **Install**.
5. **Apps → Installed Apps**: Status beider Apps prüfen (bei veraltetem Status die Seite neu laden).
6. **Service Discovery → Ingresses**: Den Host des Ingress `frontend` öffnen.

**Erwartetes Ergebnis:** Beide Apps zeigen `Deployed`. Die Seite unter `https://frontend-pXX-frontend.apps.k8s.tectrain.at` zeigt drei Bestellungen. Statt einer Route gibt es einen Ingress.

---

### Übung 3.9: Die kubectl-Shell

**Ziel:** Dieselben Befehle wie in OpenShift mit `kubectl` ausführen.
**Umgebung:** kubectl-Shell
**Dauer:** ca. 15 min

**Schritte:**
1. Oben rechts das Symbol **>_** (Kubectl Shell) anklicken und warten, bis „Connected“ erscheint.
2. Eingeben:
   ```sh
   kubectl get pods -n pXX-backend
   kubectl get ingress -n pXX-frontend
   kubectl describe svc api -n pXX-backend
   helm list -n pXX-backend
   helm version
   kubectl auth can-i create namespaces
   ```
3. Die Ausgaben mit denen aus OpenShift vergleichen.

**Erwartetes Ergebnis:** `kubectl` liefert dieselben Informationen wie `oc`. `helm version` zeigt Version 4. `kubectl auth can-i create namespaces` antwortet `yes`; eine zusätzliche Regel im Cluster erlaubt neue Namespaces aber nur im eigenen Project.

---

### Übung 3.10: Upgrade und Rollback in Rancher

**Ziel:** Updates und Rollbacks in der Rancher-Oberfläche durchführen.
**Umgebung:** Rancher, kubectl-Shell
**Dauer:** ca. 20 min

**Schritte:**
1. **Apps → Installed Apps**, App `api`, Menü **⋮ → Edit / Change Version**. Version `1.1.0` wählen, **Next**, die Zeile `role` im YAML-Editor ansehen und **Upgrade** wählen.
2. Status und Seite prüfen (API-Version 1.1.0).
3. Das Menü **⋮** der App `api` erneut öffnen: Es bietet keinen Rollback. In der kubectl-Shell zurückrollen:
   ```sh
   helm repo add k8s-lab https://cgamperl.github.io/k8s-lab/
   helm history api -n pXX-backend
   helm rollback api -n pXX-backend
   helm history api -n pXX-backend
   ```
4. Das Frontend mit der Kommandozeile aktualisieren:
   ```sh
   echo "role: frontend" > web-values.yaml
   helm upgrade web k8s-lab/shop --version 1.1.0 -n pXX-frontend -f web-values.yaml
   ```

**Erwartetes Ergebnis:** Nach dem Upgrade API 1.1.0, nach dem Rollback wieder 1.0.0; `helm history` zeigt drei Revisionen, die letzte mit „Rollback to 1“. Das Frontend läuft mit Version 1.1.0 und behält seine Rolle.

---

### Übung 3.11 (Zusatz): Pod Security in Kubernetes

**Ziel:** Das Verhalten eines root-Images in Kubernetes mit OpenShift vergleichen.
**Umgebung:** Rancher
**Dauer:** ca. 15 min

**Schritte:**
1. **Workloads → Deployments → Create**. Namespace `pXX-frontend`, Name `nginx`, Container Image `nginx:1.27-alpine`. **Create**.
2. Status und Logs des Pods ansehen.
3. In der kubectl-Shell: `kubectl exec -n pXX-frontend deploy/nginx -- id`.
4. Das Deployment wieder löschen.

**Erwartetes Ergebnis:** Anders als in OpenShift (Übung 1.13) startet das Image und läuft als `uid=0(root)`. Beim Anlegen kann eine Warnung „would violate PodSecurity restricted“ erscheinen; sie verhindert nichts. Der Namespace erlaubt root-Container (Pod Security `baseline`), verbietet aber privilegierte Container und Zugriff auf den Node.

---

### Übungen 3.12–3.13: Szenarien in Rancher

Vorbereitung in der kubectl-Shell (sie verliert beim Schließen Dateien und Repositories):
```sh
helm repo add k8s-lab https://cgamperl.github.io/k8s-lab/
echo "role: frontend" > web-values.yaml
```

Der Trainer startet zwei Szenarien in den Rancher-Projects. Vorgehen wie an Tag 2, mit `kubectl` und der Rancher-Oberfläche (Pod → ⋮ → View Logs, Events unter **Cluster → Events** oder im Pod).

| Szenario | Symptom | Wo gefunden | Ursache | Unterschied zu OpenShift |
|---|---|---|---|---|
| 3.12 | | | | |
| 3.13 | | | | |

**Dauer:** ca. 15 min je Szenario.

---

### Übung 3.14: Break & Fix Challenge

**Ziel:** Fehler ohne Anleitung finden und beheben.
**Umgebung:** OpenShift-Konsole, Web Terminal
**Dauer:** ca. 60 min
**Ticket:** SHOP-1050 · Bereitschaft am Aktionstag: eingehende Störungen bearbeiten.

**Regeln:**
1. Der Trainer setzt die Anwendung jedes Teilnehmers in einen fehlerhaften Zustand. Die Fehler sind nicht für alle gleich.
2. Ziel ist eine funktionierende Seite mit drei Bestellungen. Der Trainer sieht den Zustand aller Anwendungen auf einer Übersicht.
3. Nach jeder Behebung den Trainer informieren; es folgt der nächste Fehler.
4. Erlaubt sind alle Werkzeuge des Kurses und das eigene Protokoll. Nicht erlaubt: die Anwendung löschen und neu installieren.
5. Pro behobenem Fehler: Symptom, Ursache und Behebung in einem Satz notieren.

| Runde | Symptom | Ursache | Behebung | Zeit |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
