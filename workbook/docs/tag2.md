# Tag 2: Helm, Updates, Fehlersuche

`XX` steht wie an Tag 1 für die eigene Teilnehmernummer. Die Projects `pXX-frontend` und `pXX-backend` sind zu Beginn leer.

::: warning Eigene Nummer einsetzen
Befehle und Werte mit `XX` vor dem Ausführen anpassen: `pXX` wird z. B. zu `p07`, der Port `81XX` zu `8107`. Kopierte Befehle enthalten noch `XX`.
:::

**Fallbeispiel:** Die Entwicklung liefert den Shop für die Super Shop GmbH ab heute als Helm Chart. Der Tag folgt der Installation, dem Update auf eine neue Version und den ersten Störungsmeldungen des Vertriebs.

Helm-Repository der Schulung: `https://cgamperl.github.io/k8s-lab/`, Chart `shop`. Die Anwendung wird zweimal aus demselben Chart installiert:

| Release | Project | Rolle |
|---|---|---|
| `api` | `pXX-backend` | API mit Log-Sidecar (Standardwerte) |
| `web` | `pXX-frontend` | Frontend mit Route (Value `role: frontend`) |

---

### Übung 2.1: Ein Helm-Repository hinzufügen

**Ziel:** Das Repository der Entwicklungsabteilung in der Konsole bekannt machen.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 10 min
**Ticket:** SHOP-1010 · Die Installation bei Super Shop durch das Helm Chart ersetzen.

**Schritte:**
1. Links **Ecosystem → Helm** öffnen, Project `pXX-backend`.
2. **Create → Repository**. **Name:** `k8s-lab`, **URL:** `https://cgamperl.github.io/k8s-lab/`. **Create**.
3. Dasselbe im Project `pXX-frontend`.
4. Reiter **Repositories** auf der Helm-Seite ansehen.

**Erwartetes Ergebnis:** In beiden Projects ist das Repository `k8s-lab` eingetragen. Es gilt nur für das jeweilige Project.

---

### Übung 2.2: Das Chart ansehen

**Ziel:** Versionen und Standardwerte eines Charts vor der Installation prüfen.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 10 min

**Schritte:**
1. **Ecosystem → Software Catalog**, Project `pXX-backend`, Typ **Helm Charts**, Suchbegriff `shop`.
2. Die Kachel **Shop** öffnen und die Beschreibung lesen. **Create** wählen.
3. Im Formular die Liste **Chart version** öffnen und ansehen, dann wieder schließen.
4. Im YAML-Editor die Standardwerte lesen: `role`, `api.replicas`, `api.config`, `api.probes`, `api.resources`, `sidecar`, `exposure`.
5. **Cancel**.

**Erwartetes Ergebnis:** Die Liste zeigt mehrere Chart-Versionen. `role` hat den Standardwert `api`. Die Formularansicht ist deaktiviert, Werte werden im YAML-Editor bearbeitet.

---

### Übung 2.3: Die Anwendung mit Helm installieren

**Ziel:** Beide Releases in der Konsole installieren.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. Wie in 2.2 im Project `pXX-backend` das Chart **Shop** öffnen und **Create** wählen.
2. **Release name:** `api`, **Chart version:** `1.0.0`. Die Werte unverändert lassen. **Create**.
3. Im Project `pXX-frontend` das Chart erneut öffnen. **Release name:** `web`, **Chart version:** `1.0.0`.
4. Im YAML-Editor die Zeile `role: api` in `role: frontend` ändern. **Create**.
5. In der Topology von `pXX-frontend` die Route des Frontends öffnen.

**Erwartetes Ergebnis:** Die Topology zeigt je einen gestrichelten Helm-Rahmen. Die Seite zeigt drei Bestellungen, die Frontend- und API-Version 1.0.0 und die antwortende API-Instanz.

---

### Übung 2.4: Ein Release untersuchen

**Ziel:** Die Ansichten eines Helm-Releases kennenlernen.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 10 min

**Schritte:**
1. **Ecosystem → Helm**, Project `pXX-backend`, Release `api` öffnen.
2. Reiter **Details**, **Resources**, **Revision history**, **Release notes** ansehen.
3. Unter **Resources** die Objekte notieren, die das Release angelegt hat.
4. Unter **Workloads → Pods** einen API-Pod öffnen, Reiter **Logs**, und mit der Container-Auswahl zwischen `api` und `log-sidecar` wechseln.

**Erwartetes Ergebnis:** Das Release besteht aus Deployment, Service und ConfigMap; das Release `web` aus Deployment, Service und Route. Der Container `api` schreibt nur Zugriffe, `log-sidecar` zeigt die Anwendungsmeldungen.

---

### Übung 2.5: Helm im Web Terminal

**Ziel:** Dieselben Releases mit der Kommandozeile betrachten.
**Umgebung:** Web Terminal
**Dauer:** ca. 15 min
**Ticket:** SHOP-1011 · Version 1.1.0 ohne Ausfall einspielen, mit Möglichkeit zur Rücknahme.

**Schritte:**
1. Oben rechts auf **>_** klicken, Project `pXX-backend`, **Start**. Etwa eine Minute warten.
2. Eingeben:
   ```sh
   helm repo add lab https://cgamperl.github.io/k8s-lab/
   helm search repo lab/shop --versions
   helm list -n pXX-backend
   helm list -n pXX-frontend
   helm get values web -n pXX-frontend
   helm history api -n pXX-backend
   ```

**Erwartetes Ergebnis:** `helm list` zeigt `api` bzw. `web` mit Chart `shop-1.0.0`, Status `deployed`, Revision 1. `helm get values web` enthält `role: frontend`.

---

### Übung 2.6: Upgrade mit Rolling Update

**Ziel:** Die API auf eine neue Version aktualisieren und den Austausch der Pods beobachten.
**Umgebung:** Web Terminal, OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. In der Konsole die Topology von `pXX-backend` öffnen und daneben das Web Terminal.
2. Im Web Terminal:
   ```sh
   helm upgrade api lab/shop --version 1.1.0 -n pXX-backend
   oc rollout status deployment/api -n pXX-backend
   oc get replicasets -n pXX-backend
   ```
3. Die Seite der Anwendung neu laden.
4. `helm history api -n pXX-backend`.

**Erwartetes Ergebnis:** Die Pods werden einzeln ersetzt („1 out of 2 new replicas have been updated“). Danach gibt es zwei ReplicaSets, das alte mit 0 Pods. Die Seite zeigt die API-Version 1.1.0. Der Verlauf enthält zwei Revisionen.

---

### Übung 2.7: Upgrade in der Konsole

**Ziel:** Das Frontend in der Konsole aktualisieren und dabei die Werte im Blick behalten.
**Umgebung:** OpenShift-Konsole
**Dauer:** ca. 15 min

**Schritte:**
1. **Ecosystem → Helm**, Project `pXX-frontend`, Release `web`, **Actions → Upgrade**.
2. Im YAML-Editor die Zeile mit `role` suchen und den Wert notieren.
3. **Chart version** auf `1.1.0` stellen. Die Zeile mit `role` erneut ansehen.
4. Ohne weitere Änderung **Upgrade** wählen.
5. Die Topology von `pXX-frontend` und die Seite der Anwendung ansehen.
6. Beschreiben, was passiert ist, und im Release unter **Revision history** über das Menü der Zeile von Revision 1 **Rollback to Revision 1** ausführen.

**Erwartetes Ergebnis:** Vor dem Versionswechsel steht `role: frontend`, danach `role: api`. Nach dem Upgrade läuft in `pXX-frontend` eine zweite API, die Route fehlt, die Seite ist nicht erreichbar. Nach dem Rollback läuft das Frontend wieder; der Verlauf zeigt drei Revisionen, die letzte mit „Rollback to 1“.

---

### Übung 2.8: Upgrade mit einer Values-Datei

**Ziel:** Eigene Werte bei Upgrades zuverlässig mitgeben.
**Umgebung:** Web Terminal
**Dauer:** ca. 15 min

**Schritte:**
1. Eine Values-Datei anlegen und prüfen:
   ```sh
   echo "role: frontend" > web-values.yaml
   cat web-values.yaml
   ```
2. Vorschau ohne Änderung:
   ```sh
   helm upgrade web lab/shop --version 1.1.0 -n pXX-frontend -f web-values.yaml --dry-run | grep -A3 "kind: Route"
   ```
3. Upgrade ausführen: denselben Befehl ohne `--dry-run` und ohne `| grep …`.
4. Seite neu laden, `helm history web -n pXX-frontend`.

**Erwartetes Ergebnis:** Die Vorschau enthält eine Route. Nach dem Upgrade zeigt die Seite Frontend-Version 1.1.0; der Verlauf hat vier Revisionen.

**Zusatz:** Mit `helm rollback api -n pXX-backend` die API auf die vorige Revision zurücksetzen und mit `helm history` prüfen, welche Chart-Version jetzt läuft.

---

### Übung 2.9: Probes, Ressourcen und Quota

**Ziel:** Die Einstellungen finden, die über Neustarts, Bereitschaft und Speicherlimits entscheiden.
**Umgebung:** OpenShift-Konsole, Web Terminal
**Dauer:** ca. 20 min
**Ticket:** SHOP-1012 · Die Ressourcenangaben des Shops gegen die neue Quota prüfen.

**Schritte:**
1. **Workloads → Deployments → api**, Reiter **YAML**. Die Abschnitte `readinessProbe`, `livenessProbe` und `resources` beider Container suchen.
2. Im Web Terminal:
   ```sh
   oc describe quota -n pXX-backend
   oc describe limitrange -n pXX-backend
   ```
3. Im Web Terminal die Health-Endpunkte der API aufrufen:
   ```sh
   curl -s http://api.pXX-backend:8080/ready
   curl -s http://api.pXX-backend:8080/health
   ```
4. Werte notieren: Welche Pfade prüfen die Probes? Wie viel Speicher darf der Container `api` höchstens verwenden? Wie viel der Quota ist belegt?

**Erwartetes Ergebnis:** Readiness prüft `/ready`, Liveness `/health`; das Speicherlimit von `api` beträgt 256 Mi. Die Quota zeigt für `pods`, `limits.memory` und weitere Werte Belegung und Grenze; das Web Terminal zählt mit.

---

### Übungen 2.10–2.17: Geführte Fehlerszenarien

**Vorbereitung im Web Terminal** (das Terminal verliert nach längerer Inaktivität seine Dateien und Repositories):
```sh
helm repo add lab https://cgamperl.github.io/k8s-lab/
echo "role: frontend" > web-values.yaml
```

Der Trainer bringt die Anwendung aller Teilnehmer gleichzeitig in einen fehlerhaften Zustand. Für jedes Szenario:

1. **Symptom feststellen:** Was zeigt die Seite der Anwendung? Was zeigt die Topology?
2. **Methode anwenden:**
   - Läuft die Anwendung? Pod-Status und READY → Events → Logs (bei Neustarts der vorige Lauf, bei zwei Containern beide) → YAML/Details.
   - Kommt die Anfrage an? Route → Service → Endpoints → Pod.
   - Was hat sich geändert? `helm history`, Revision history.
3. **Ursache benennen** und im Protokoll festhalten.
4. **Beheben**, möglichst mit Helm: Rollback, oder Upgrade auf eine funktionierende Version (beim Release `web` mit der Values-Datei aus 2.8).
5. **Prüfen:** Die Seite zeigt wieder drei Bestellungen.

Protokoll pro Szenario:

| Szenario | Symptom | Wo gefunden (Ansicht, Befehl) | Ursache | Behebung |
|---|---|---|---|---|
| 2.10 (SHOP-1021) | | | | |
| 2.11 (SHOP-1022) | | | | |
| 2.12 (SHOP-1023) | | | | |
| 2.13 (SHOP-1024) | | | | |
| 2.14 (SHOP-1025) | | | | |
| 2.15 (SHOP-1026) | | | | |
| 2.16 (SHOP-1027) | | | | |
| 2.17 (SHOP-1028) | | | | |

Hinweise:
- Ein Rollback ist nur möglich, wenn das Release eine vorige, funktionierende Revision hat. `helm history` zeigt das.
- Die Tabelle im Anhang „Symptome und typische Ursachen“ hilft bei der Einordnung.
