---
description: Run the full PO -> Architect -> Developer -> QA -> Security -> DevOps -> Documentation pipeline for one feature request against the Lieferanten-Extranet, writing outputs to docs/ and a consolidated status report to docs/workflow/.
argument-hint: <Feature-Beschreibung>
---

Du führst die vollständige Feature-Pipeline für das Lieferanten-Extranet aus,
für folgende Feature-Anfrage:

"$ARGUMENTS"

Arbeite die Schritte strikt in dieser Reihenfolge ab. Überspringe keinen
Schritt. Fehlt nach einem Schritt die erwartete Output-Datei, brich die
Pipeline nicht ab — vermerke stattdessen im Abschlussbericht "Fehler" für
diesen Schritt und fahre mit den verbleibenden Schritten fort, sofern deren
Eingaben noch sinnvoll sind (fehlt eine kritische Eingabe wie die
Backlog-Story, kennzeichne alle Folgeschritte als "Übersprungen").

Jeder Subagenten-Aufruf (über das Agent-Tool) muss dem Subagenten die
relevanten Datei-Pfade explizit im Prompt mitgeben — Subagenten teilen
keinen Konversationskontext mit dir und untereinander, die Dateien unter
`docs/` sind der einzige Übergabemechanismus.

## 0. Slug ableiten

Leite aus der Feature-Beschreibung einen kebab-case `<slug>` ab (max. ca. 6
Wörter, nur Kleinbuchstaben/Bindestriche). Dieser Slug wird für alle
Output-Dateien dieses Laufs verwendet.

## 1. Product Owner

Rufe den `po`-Subagenten auf (Agent-Tool, subagent_type="po") mit der
Feature-Beschreibung und dem Slug. Prüfe danach, dass
`docs/backlog/<slug>.md` existiert; lies die Datei.

## 2. Architect

Rufe den `architect`-Subagenten auf. Gib ihm den Pfad zu
`docs/backlog/<slug>.md` und den Slug mit, mit der Anweisung, diese Datei
zuerst zu lesen. Prüfe, dass mindestens eine neue Datei unter
`docs/architecture/adr/` entstanden ist; lies sie.

## 3. Developer

Rufe den `developer`-Subagenten auf. Gib ihm Slug, den Pfad zur
Backlog-Datei und die Pfad(e) zur/den ADR(s) mit. Notiere dir aus seiner
Antwort, welche Dateien/Code er geändert hat (für den Abschlussbericht).

## 4. QA

Rufe den `qa`-Subagenten auf. Gib ihm Slug, Backlog-Pfad, ADR-Pfad(e) und
eine kurze Notiz mit, was der Developer geändert hat. Prüfe, dass
`docs/qa/<slug>.md` existiert; lies sie und merke dir den Freigabe-Status.

## 5. Security

Rufe den `security`-Subagenten auf. Gib ihm Slug, Backlog-Pfad, ADR-Pfad(e)
und den Pfad zum QA-Bericht mit. Der Security-Agent hat **kein Write-Tool**
und gibt seinen vollständigen Bericht als Antworttext zurück — **du**
schreibst diesen Text unverändert nach `docs/security/<slug>.md` (Datei
anlegen). Merke dir den Freigabe-Status/Schweregrad aus dem Text.

## 6. DevOps

Rufe den `devops`-Subagenten auf. Gib ihm Slug, ADR-Pfad(e) und den Pfad
zum Security-Bericht mit (für Secrets-/Rollout-Implikationen). Prüfe, dass
`docs/devops/<slug>.md` existiert; lies sie.

## 7. Documentation

Rufe den `documentation`-Subagenten auf. Gib ihm den Slug und die Pfade zu
Backlog-, ADR-, QA-, Security- und DevOps-Dokumenten mit. Prüfe, dass
`docs/product/<slug>.md` existiert; lies sie.

## 8. Konsolidierter Statusbericht

Schreibe `docs/workflow/<slug>-status.md`:

```markdown
# Pipeline-Status: <Feature-Beschreibung>

Datum: <heutiges Datum>

## Schritte
| Schritt | Rolle | Output-Datei | Status |
|---|---|---|---|
| 1 | Product Owner | docs/backlog/<slug>.md | OK/Fehler/Übersprungen |
| 2 | Architect | docs/architecture/adr/... | OK/Fehler/Übersprungen |
| 3 | Developer | (geänderte Dateien) | OK/Fehler/Übersprungen |
| 4 | QA | docs/qa/<slug>.md | OK/Fehler/Übersprungen |
| 5 | Security | docs/security/<slug>.md | OK/Fehler/Übersprungen |
| 6 | DevOps | docs/devops/<slug>.md | OK/Fehler/Übersprungen |
| 7 | Documentation | docs/product/<slug>.md | OK/Fehler/Übersprungen |

## Zusammenfassung
(2-4 Sätze, rollenübergreifende Synthese)

## Offene Risiken / Blocker
(aus QA "Blockiert" oder Security "kritisch"/"hoch" — prominent auflisten,
falls vorhanden; sonst "Keine")

## Nächste Schritte
- ...
```

## 9. Abschluss im Chat

Gib eine kurze Zusammenfassung im Chat aus: Pfad zum Statusbericht plus ein
Einzeiler-Fazit (z. B. "Pipeline abgeschlossen, aber QA hat 1 blockierenden
Befund gemeldet — siehe docs/qa/<slug>.md").
