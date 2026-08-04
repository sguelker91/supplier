# 0003. Monorepo statt Polyrepo für das Lieferanten-Extranet

## Status
Vorgeschlagen

## Kontext
`CLAUDE.md` setzt bislang unreflektiert "Monorepo-Layout unter `apps/`" als
Ausgangspunkt voraus, ohne dass eine echte Abwägung Monorepo vs. Polyrepo
anhand der Projektanforderungen dokumentiert wurde.
`docs/architecture/overview.md` listet "Monorepo-Tooling" bislang nur als
offene *Werkzeug*-Frage (Turborepo/Nx/Workspaces), ohne die vorgelagerte
Grundsatzfrage (ein Repository oder mehrere getrennte Repositories je App)
explizit zu klären. Diese ADR holt diese Grundsatzentscheidung nach.

Relevante Ausgangslage:
- `apps/web`, `apps/mobile` und `apps/api` liegen bereits gemeinsam in einem
  Repository (`sguelker91/supplier`), ebenso `docs/` und `.claude/`.
- `apps/web` und potenziell `apps/mobile` konsumieren dasselbe Backend
  `apps/api`. [ADR 0001](0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
  definiert bereits einen `Contract`-Datenkontrakt in `apps/api`, der explizit
  als von mehreren Frontends nutzbar beschrieben ist.
- Es gibt aktuell **keine** organisatorische Trennung zwischen einem
  "Mobile-Team" und einem "Web-Team" — ein einzelner menschlicher Entwickler
  arbeitet mit einem Team von Claude-Code-Subagenten (PO, Architect,
  Developer, QA, Security, DevOps, Documentation, Orchestrator), die alle im
  selben Repository lesen/schreiben.
- Die gesamte Agenten-Pipeline referenziert sich ausschließlich über
  **relative Dateipfade innerhalb eines Repos**: Backlog-Storys verlinken
  ADRs, ADRs verlinken Backlog-Storys, QA-/Security-/DevOps-Berichte
  verlinken ADRs und Code unter `apps/*` (siehe z. B. die Verlinkungen in
  ADR 0001 und ADR 0002 auf `../../backlog/...`).

## Entscheidung
Das Lieferanten-Extranet bleibt als **ein Monorepo** organisiert
(`apps/web`, `apps/mobile`, `apps/api` sowie `docs/` und `.claude/` in einem
Repository). Polyrepo (separate Repositories je App) wird explizit geprüft
und **verworfen**. Die konkrete Monorepo-*Tooling*-Wahl (Turborepo, Nx,
npm-/pnpm-Workspaces o. Ä.) ist von dieser Entscheidung getrennt und bleibt
offen (siehe `overview.md`).

Begründung entlang der abgewogenen Kriterien:

1. **Geteilte TypeScript-Contracts.** ADR 0001 etabliert einen
   `Contract`-Datenkontrakt in `apps/api`, der potenziell von `apps/web`
   *und* `apps/mobile` konsumiert wird. Im Monorepo können diese Typen direkt
   (z. B. als internes Workspace-Package) importiert werden — Änderungen an
   API-Typen werden beim Build der Frontends sofort sichtbar
   (Compile-Zeit-Konsistenz), ohne Publishing-Schritt. Bei Polyrepo müsste
   dieser Contract als separat versioniertes npm-Package publiziert und in
   Web/Mobile als Dependency gepflegt und aktuell gehalten werden —
   zusätzlicher Release-Prozess für ein rein internes Implementierungsdetail,
   mit dem Risiko, dass ein Frontend gegen eine veraltete Contract-Version
   entwickelt oder deployt wird (Versionsdrift).
2. **Atomare Cross-App-Änderungen.** Eine Änderung am API-Contract (z. B. ein
   neues Pflichtfeld, ein geändertes Statusmodell) lässt sich im Monorepo in
   einem Commit/PR zusammen mit den erforderlichen Anpassungen in
   `apps/web`/`apps/mobile` umsetzen, reviewen und in CI gemeinsam testen.
   Bei Polyrepo entstehen zwangsläufig zeitversetzte, koordinierte
   Multi-Repo-Änderungen mit Zwischenzuständen (API bereits geändert,
   Frontend noch nicht angepasst) und entsprechendem Koordinationsaufwand.
   Bei einem einzelnen menschlichen Entwickler ist dieser Koordinationsaufwand
   reiner Overhead ohne Gegenwert.
3. **Agenten-Harness-Realität (projektspezifisch entscheidend).** Die
   gesamte Pipeline (PO → Architect → Developer → QA → Security → DevOps →
   Documentation, orchestriert über `/orchestrate`) funktioniert, indem
   Agenten Dokumente und Code über **relative Dateipfade innerhalb eines
   Arbeitsverzeichnisses** referenzieren (Backlog ↔ ADR ↔ QA-/Security-/
   DevOps-Bericht ↔ Code unter `apps/*`). Ein Claude-Code-Agent operiert
   jeweils in genau einem Arbeitsverzeichnis/Repository. Ein Polyrepo-Schnitt
   würde diesen Verlinkungsmechanismus vollständig brechen (relative Pfade
   funktionieren nicht über Repo-Grenzen hinweg) und entweder ein
   Meta-Repo-/Submodule-Konstrukt erzwingen — das die angestrebten
   Polyrepo-Vorteile (unabhängige Repos, unabhängiges Tooling) faktisch
   wieder aufhebt — oder die Dokumentationskohärenz der gesamten Pipeline
   gefährden.
4. **Zugriffssteuerung / Team-Trennung.** Der Hauptvorteil von Polyrepo —
   granulare, repo-scoped Zugriffsrechte für getrennte Teams (z. B. ein
   Mobile-Team ohne Zugriff auf API-Code) — hat aktuell keinen Gegenwert, da
   kein solches getrenntes Team existiert. Diese Bewertung ist explizit an
   die aktuelle Team-Realität gebunden (siehe "Konsequenzen/Risiken").
5. **CI-/Tooling-Overhead.** Polyrepo bedeutet N separate CI-Pipelines, N
   getrennte Dependency-Update-Prozesse und N Stellen für Lint-/
   Test-Konfiguration, die synchron gehalten werden müssten. Ein Monorepo
   konzentriert dies auf eine Pipeline (optional mit Path-Filtering pro App).
   Welches konkrete Tooling dafür verwendet wird, entscheidet diese ADR
   **nicht** — das bleibt eine offene Folgefrage.

**Geprüfte, aber nicht ausschlaggebende Gegenposition:** `apps/mobile`
unterliegt als App-Store-Release einem anderen Deployment-Rhythmus als
`apps/web` und `apps/api` (Store-Review-Zeiten, gestaffelte Rollouts). Das ist
ein valides generisches Polyrepo-Argument (unabhängige Release-Zyklen), wird
hier aber als nicht ausschlaggebend bewertet: unabhängiges Deployment pro App
ist auch im Monorepo über separate CI-Jobs/Release-Tags pro App-Verzeichnis
möglich, ohne die oben genannten Vorteile (geteilte Typen, funktionierende
Agenten-Harness) aufzugeben.

## Konsequenzen
- `apps/web`, `apps/mobile`, `apps/api`, `docs/` und `.claude/` bleiben
  dauerhaft in einem Repository. Zukünftige ADRs und Backlog-Storys können
  weiterhin über relative Pfade referenzieren, ohne Repo-Grenzen zu
  berücksichtigen.
- Sobald ein geteiltes Contract-Package tatsächlich extrahiert wird (z. B.
  `Contract`-Typen aus ADR 0001) oder eine CI-Pipeline aufgesetzt wird, ist
  die konkrete Monorepo-Tooling-Wahl (Turborepo, Nx, npm-/pnpm-Workspaces)
  als eigene, separate Entscheidung zu treffen — diese ADR nimmt das nicht
  vorweg.
- **Revisionsbedarf/Risiko:** Diese Entscheidung ist explizit an die
  aktuelle Team-Realität (ein Entwickler, kein getrenntes Mobile-/Web-Team)
  gebunden. Entsteht künftig eine organisatorische Trennung (z. B. ein
  externes Mobile-Entwicklungsteam mit eigenständigem Zugriffsbedarf), sollte
  diese ADR neu bewertet und ggf. durch eine Folge-ADR ersetzt werden, statt
  stillschweigend am Monorepo festzuhalten.
- Kein stillschweigendes Erweitern des Scopes: Diese ADR trifft keine
  Aussage über Paketmanager, Test-Framework oder CI-Provider — diese
  bleiben laut `overview.md` weiterhin offen und werden entschieden, sobald
  eine Story sie zwingend benötigt.

## Datenklassifizierung
Diese ADR ist rein struktureller Natur (Repository-Organisation) und betrifft
keine neue Datenverarbeitung oder neuen Entitäten. Die indirekt relevanten
Entitäten sind bereits an anderer Stelle klassifiziert:
- **Kontrakt** (`Contract`): DSGVO-/kommerziell sensibel laut
  Domain-Glossar und [ADR 0001](0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
  — Grund, warum konsistente (geteilte) Typdefinitionen zwischen `apps/api`
  und den Frontends besonders wichtig sind (keine Versionsdrift bei
  sensiblen Feldern).
- **Lieferant** (`Supplier`): Stammdaten-sensibel laut Domain-Glossar,
  bereits klassifiziert in ADR 0001/ADR 0002.

Kein neuer Klassifizierungsbedarf durch diese ADR.

## Implementierungsnotizen

Da die physische Repository-Struktur (`apps/web`, `apps/mobile`, `apps/api`,
`docs/`, `.claude/` in einem Repository) bereits bestand, bestand die
"Implementierung" dieser ADR ausschließlich aus einer Doku-Nachpflege, damit
kein Dokument die Monorepo-Frage mehr als offen/unbegründet darstellt:

- `CLAUDE.md`, Abschnitt "Tech-Stack": Verweist jetzt explizit auf diese ADR
  als Begründung für "Monorepo-Layout unter `apps/`". Die "Noch offen"-Liste
  wurde präzisiert: Sie bezieht sich nur noch auf die Werkzeug-Wahl
  (Paketmanager, Monorepo-Tooling, Test-Framework, CI-Provider), nicht mehr
  auf die Repo-Struktur selbst.
- `README.md` (root), Abschnitt "Tech-Stack": Gleiche Klarstellung — Monorepo
  als entschiedene Struktur (ADR 0003), Tooling/Test/CI/Auth weiterhin offen
  und davon unabhängig.
- `docs/architecture/overview.md` referenzierte diese ADR bereits korrekt als
  getroffene Entscheidung (Abschnitte "Aktueller Stand" und "Offene
  technische Entscheidungen") — keine Änderung nötig.
- `apps/web/README.md`, `apps/mobile/README.md`, `apps/api/README.md`
  enthalten keine Formulierungen, die die Monorepo-Struktur als
  vorläufig/unentschieden darstellen (sie verweisen lediglich auf die noch
  ausstehende erste Scaffolding-ADR); keine Änderung vorgenommen, um keine
  neuen Fakten zu erfinden.

Kein Workspace-Tooling, keine Turborepo-/Nx-Konfiguration und kein root
`package.json` mit `workspaces`-Feld wurden angelegt — das bleibt laut
Konsequenzen dieser ADR eine separate, spätere Entscheidung.

Hinweis: Der Status dieser ADR ist im Dokument weiterhin als "Vorgeschlagen"
vermerkt. Diese Implementierungsnotiz nimmt keine Statusänderung vor — das
ist Sache des Architect-Agents, falls eine formelle Annahme noch aussteht.
