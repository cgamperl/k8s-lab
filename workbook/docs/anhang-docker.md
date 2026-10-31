# Anhang: Docker-Befehle

Befehle und Optionen aus den Übungen an Tag 1. `api` steht für einen Containernamen.

## Container starten

| Befehl bzw. Option | Bedeutung |
|---|---|
| `docker run <image>` | Container aus einem Image erzeugen und starten; fehlt das Image lokal, wird es zuerst geladen |
| `-d` | im Hintergrund starten; die Eingabeaufforderung kehrt sofort zurück, die Ausgabe zeigt `docker logs` |
| `--name api` | fester Name; ohne die Option vergibt Docker einen zufälligen Namen |
| `-e NAME=wert` | Umgebungsvariable im Container setzen |
| `-p 8090:8080` | Port 8090 des Rechners auf Port 8080 im Container weiterleiten (Rechner:Container) |
| `-v api-logs:/var/log/app` | benanntes Volume `api-logs` unter `/var/log/app` einbinden |
| `-v ${PWD}\logs:/var/log/app` | Verzeichnis `logs` im aktuellen Verzeichnis einbinden (Bind Mount, PowerShell) |
| `--rm` | Container nach dem Ende automatisch entfernen |

## Container untersuchen und verwalten

| Befehl bzw. Option | Bedeutung |
|---|---|
| `docker ps` | laufende Container |
| `docker ps -a` | alle Container, auch beendete, mit Status und Exit-Code |
| `docker logs api` | Standardausgabe und Fehlerausgabe des Containers |
| `docker exec api <befehl>` | einen Befehl im laufenden Container ausführen |
| `docker exec -it api sh` | Shell im laufenden Container; `-i` hält die Eingabe offen, `-t` stellt ein Terminal bereit; `exit` beendet die Shell |
| `docker diff api` | Änderungen im Dateisystem gegenüber dem Image (`A` hinzugefügt, `C` geändert, `D` gelöscht) |
| `docker stop api` / `docker start api` | Container anhalten bzw. wieder starten; der Inhalt bleibt erhalten |
| `docker rm api` | beendeten Container entfernen |
| `docker rm -f api` | Container entfernen, auch wenn er läuft (`-f` = force) |

## Images und Volumes

| Befehl bzw. Option | Bedeutung |
|---|---|
| `docker history <image>` | Schichten des Images mit den Anweisungen, aus denen sie entstanden sind |
| `docker image inspect <image> --format "…"` | Metadaten des Images; `--format` wählt einzelne Felder aus |
| `docker volume rm api-logs` | Volume löschen; nur möglich, wenn kein Container es verwendet |

## Docker Compose

| Befehl bzw. Option | Bedeutung |
|---|---|
| `docker compose up -d` | alle Dienste aus `compose.yaml` im aktuellen Verzeichnis im Hintergrund starten |
| `docker compose up -d --scale api=2` | wie oben, Dienst `api` mit zwei Instanzen |
| `docker compose ps` | Container des Projekts mit Status |
| `docker compose down -v` | Container und Netzwerk entfernen, mit `-v` auch die Volumes |

## Häufige Meldungen

| Meldung | Ursache und Abhilfe |
|---|---|
| `Conflict. The container name "/api" is already in use` | Ein Container mit diesem Namen existiert noch; `docker rm -f api` |
| `ports are not available` bzw. `port is already allocated` | Der linke Port bei `-p` ist auf dem Rechner belegt; einen anderen wählen |
| `No such container` | Name falsch geschrieben oder Container bereits entfernt; `docker ps -a` |
