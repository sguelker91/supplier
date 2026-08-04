# Lieferanten-Extranet

## Projektzweck

Dieses Repository enthält das **Lieferanten-Extranet**: eine Web-Anwendung und eine
mobile App (Android + iOS), über die externe Lieferanten mit dem Unternehmen
interagieren. Stamm- und Bewegungsdaten sowie Dokumente stammen aus dem
unternehmensinternen **ERP-System** und werden über die Integrations-/EDI-Middleware
**Lobster** an das Extranet angebunden. Lobster/ERP sind aus Sicht dieses Repos eine
**externe Systemgrenze** — Integrationsdetails werden vom Architect-Agenten in ADRs
festgelegt, sobald sie für ein Feature relevant sind.

Kernfunktionen für Lieferanten:
- Einsicht in **Lieferberechtigungen** und **Kontrakte**
- Einsicht in **Abnahmescheine**
- Zugriff auf **Belege** (Steuerbescheid, Prämien, Gutschriften)
- **Mengenmeldung** (Meldung von Liefermengen)
- **Abfragen/Umfragen** als bidirektionaler Kommunikationskanal

## Domain-Glossar

Verbindliche deutsche Fachbegriffe und ihre Code-Entsprechungen stehen in
[`docs/domain-glossar.md`](docs/domain-glossar.md). Alle Agenten und
Mitwirkenden verwenden ausschließlich diese Begriffe — keine Synonyme oder
Ad-hoc-Übersetzungen erfinden.

## Tech-Stack

Durchgängig TypeScript:
- **Web**: React
- **Mobile**: React Native / Expo (Android + iOS)
- **API**: Node.js / NestJS

Monorepo-Layout unter `apps/`. **Noch offen**: Paketmanager, Monorepo-Tooling
(z. B. Turborepo/Nx/npm-Workspaces), Linting/Test-Framework, CI-Provider. Diese
Entscheidungen trifft der Architect-Agent in seiner ersten ADR
(`docs/architecture/adr/0001-*.md`), sobald reale Implementierungsarbeit beginnt.
Bis dahin keine Konventionen annehmen, die nicht per ADR belegt sind.

## Monorepo-Layout

```
apps/
  web/      React Web-App
  mobile/   React Native / Expo App
  api/      NestJS Backend
docs/       Fachliche & technische Dokumentation der Agenten
.claude/    Agenten- und Pipeline-Definitionen
```

## Agenten-Team

| Rolle | Datei | Zuständigkeit | Output |
|---|---|---|---|
| Product Owner | `.claude/agents/po.md` | Feature-Anfragen in User Stories + Akzeptanzkriterien übersetzen | `docs/backlog/<slug>.md` |
| Architect | `.claude/agents/architect.md` | Technisches Design, ADRs, Systemgrenzen (inkl. Lobster/ERP) | `docs/architecture/adr/*.md` |
| Developer | `.claude/agents/developer.md` | Implementierung gemäß ADR und Backlog-Story | `apps/*` |
| QA | `.claude/agents/qa.md` | Testkonzept, Verifikation gegen Akzeptanzkriterien, DSGVO-Prüfpunkte | `docs/qa/<slug>.md` |
| Security | `.claude/agents/security.md` | Bedrohungsanalyse, DSGVO/GDPR-Bewertung (nur lesend, kein Schreibzugriff) | `docs/security/<slug>.md` (persistiert durch `/orchestrate`) |
| DevOps | `.claude/agents/devops.md` | CI/CD, Umgebungen, Rollout-/Secrets-Planung | `docs/devops/<slug>.md` |
| Documentation | `.claude/agents/documentation.md` | Endnutzer- und Entwickler-Dokumentation | `docs/product/<slug>.md` |
| Orchestrator | `.claude/agents/orchestrator.md` | Ad-hoc-Koordinationsfragen (führt die Pipeline **nicht** selbst aus) | — |

## Pipeline starten

Für ein vollständiges Feature (PO → Architect → Developer → QA → Security →
DevOps → Documentation) den Slash-Command ausführen:

```
/orchestrate <Feature-Beschreibung>
```

Für punktuelle Aufgaben können einzelne Agenten auch direkt angefragt werden
(z. B. "nutze den po-Agenten, um ...").

## Sensible Daten

Steuerbescheide, Prämien, Gutschriften und weitere finanzielle/personenbezogene
Lieferantendaten sind **DSGVO-relevant**. Jeder Agent behandelt sie standardmäßig
als sensibel: keine echten Lieferantendaten in Beispielen, Fixtures oder Tests —
ausschließlich klar erkennbare, synthetische Testdaten verwenden.
