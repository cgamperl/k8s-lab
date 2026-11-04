# Anhang: Symptome und typische Ursachen

Nachschlagetabelle für die Fehlersuche in Kubernetes und OpenShift. Die Spalte „Prüfen“ nennt die Ansicht oder den Befehl, in dem die Ursache meist sichtbar wird. `oc` und `kubectl` sind dabei austauschbar.

## Pods

| Symptom | Typische Ursachen | Prüfen |
|---|---|---|
| Pod `Pending` | nicht genug CPU oder Speicher auf den Nodes; Volume nicht verfügbar; Node-Auswahl (Selector, Taints) passt nicht | Events des Pods |
| Weniger Pods als gewünscht, kein Fehler am Pod | Quota überschritten; Richtlinie lehnt Pod ab | Events des ReplicaSets bzw. des Namespace; `oc describe quota` |
| `ErrImagePull`, `ImagePullBackOff` mit „not found“ / „manifest unknown“ | Tag oder Image-Name falsch; Tag in der Registry gelöscht | Events des Pods; Image-Name im YAML |
| `ImagePullBackOff` mit „unauthorized“ / „authentication required“ | privates Image ohne oder mit falschem Pull Secret | Events; `imagePullSecrets` im Pod; Secrets im Namespace |
| `ImagePullBackOff` mit Zeitüberschreitung | Registry vom Cluster aus nicht erreichbar (Proxy, Firewall) | Events |
| `CrashLoopBackOff`, Log nennt fehlende Variable oder Datei | Konfiguration fehlt oder heißt anders (ConfigMap, Secret, Variable) | Log des vorigen Laufs (Konsole: „Previous log“, CLI: `--previous`); Environment; ConfigMap |
| `CrashLoopBackOff`, Log „Permission denied“ | Image erwartet root oder schreibt in nicht beschreibbare Verzeichnisse (OpenShift: zufällige UID) | Log des vorigen Laufs; Basis-Image |
| `CreateContainerConfigError` | referenzierte ConfigMap/Secret fehlt; Sicherheitsregel (z. B. `runAsNonRoot`) verhindert den Start | Events |
| Letzter Status `OOMKilled` oder `Error`, Exit-Code 137 | Speicherlimit zu niedrig für die Anwendung | Details/YAML: Last State; Metrics |
| Häufige Neustarts, Events „Liveness probe failed“ | Liveness Probe prüft falschen Pfad/Port oder ist zu streng | Events; Probe im YAML; Endpunkt im Container aufrufen |
| `Running`, aber `READY 0/1` | Readiness Probe schlägt fehl (falscher Pfad, Anwendung nicht bereit, Abhängigkeit fehlt) | Events „Readiness probe failed“; Probe im YAML; andere Probe desselben Containers vergleichen; Endpunkt im Container aufrufen (`curl localhost:<port>/<pfad>`) |
| Pod hängt in `Terminating` | Anwendung beendet sich nicht; Finalizer; Node nicht erreichbar | Events; Details |

## Erreichbarkeit

| Symptom | Typische Ursachen | Prüfen |
|---|---|---|
| Router: 503 „Application is not available“ | Route zeigt auf nicht vorhandenen Service; Service ohne bereite Endpoints | Route (Ziel-Service); Endpoints des Service; READY der Pods |
| Ingress-Controller: 404 | kein Ingress für diesen Host/Pfad; Ingress zeigt auf nicht vorhandenen Service | Ingress (Host, Backend); Services |
| 502 sofort | Ziel weist ab: falscher `targetPort`, Anwendung lauscht nicht; NetworkPolicy, die abweist | Service-Ports; Endpoints mit Port; Log des aufrufenden Proxys |
| 502 mit „could not be resolved“ / „Host not found“ | Service-Name falsch oder ohne Namespace aus einem anderen Namespace aufgerufen | Konfiguration der Ziel-Adresse; `getent hosts <name>` |
| 504 nach einigen Sekunden | Ziel antwortet nicht: NetworkPolicy verwirft Pakete; Ziel überlastet; Firewall | NetworkPolicies im Ziel-Namespace; Aufruf aus dem Ziel-Namespace selbst |
| 500 | Fehler in der Anwendung | Logs, bei Sidecar-Logging das Log des Sidecars |
| Fehler nur bei jeder zweiten oder dritten Anfrage | ein Pod fehlerhaft, aber als bereit gemeldet | Logs aller Pods vergleichen; antwortenden Pod ermitteln |
| Immer derselbe Pod antwortet | übrige Pods nicht bereit; Sitzungsbindung (Cookie) direkt hinter dem Router | Endpoints; Aufruf ohne Cookie |
| Fehler nur während eines Updates | fehlende Readiness Probe; Pods erhalten noch Anfragen beim Beenden | Probes; Verlauf des Rollouts |

## Externe Systeme

| Symptom | Typische Ursachen | Prüfen |
|---|---|---|
| „Connection refused“ zu einem externen System | Port geschlossen oder Dienst gestoppt; Firewall weist ab | Aufruf aus einem Pod im selben Namespace (`curl -v`); anderer Port desselben Ziels zum Vergleich |
| Zeitüberschreitung zu einem externen System | Firewall verwirft; Routing; Egress-NetworkPolicy | Aufruf aus einem Pod; NetworkPolicies mit Egress-Regeln |
| Name des externen Systems nicht auflösbar | DNS-Eintrag fehlt oder ist im Cluster nicht sichtbar | `getent hosts <name>` aus einem Pod |
| Zertifikatsfehler zu einem externen System | eigene oder interne CA im Container nicht vertraut | Fehlermeldung im Log; CA-Bundle im Image |

Angaben für eine Firewall-Freigabe: **Quelle** (Adresse der Nodes oder Egress-IP des Clusters), **Ziel** (Hostname/Adresse), **Port und Protokoll**, **Richtung**.

## Helm

| Symptom | Typische Ursachen | Prüfen |
|---|---|---|
| Nach einem Upgrade fehlen eigene Einstellungen | beim Upgrade andere Werte angegeben (`--set`, Datei ohne alle eigenen Werte), die die bisherigen ersetzt haben; in der Konsole Werte nach Versionswechsel zurückgesetzt | `helm get values`; `helm history` |
| „another operation is in progress“ | voriges Upgrade abgebrochen, Release in `pending-*` | `helm history`; Rollback auf letzte erfolgreiche Revision |
| Von Hand geänderte Werte sind nach einem Upgrade verschwunden | Helm setzt den Stand aus Chart und Values durch | Änderung in die Values-Datei übernehmen |
| „resource already exists“ bei der Installation | Objekt gleichen Namens existiert bereits ohne Helm | vorhandenes Objekt löschen oder anderen Release-Namen wählen |
| Rollback nicht möglich | keine vorige funktionierende Revision | Upgrade auf eine funktionierende Version |
