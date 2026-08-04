# Lieferanten-Extranet

Web-Anwendung und mobile App (Android + iOS), über die externe Lieferanten mit
dem Unternehmen interagieren: Lieferberechtigungen, Kontrakte, Abnahmescheine
und Belege (Steuerbescheid, Prämien, Gutschriften) einsehen, Mengenmeldungen
abgeben und an Abfragen/Umfragen teilnehmen. Stamm- und Bewegungsdaten stammen
aus dem unternehmensinternen ERP-System und werden über die
Integrations-/EDI-Middleware **Lobster** angebunden.

Ausführlicher Projektkontext, Tech-Stack und Konventionen: siehe [`CLAUDE.md`](CLAUDE.md).
Verbindliche Fachterminologie: siehe [`docs/domain-glossar.md`](docs/domain-glossar.md).

## Stand des Projekts

Neben der Fachlogik betreibt dieses Repository ein Team aus 8 spezialisierten
Claude-Code-Subagenten, das die weitere Entwicklung strukturiert durchführt
(Product Owner, Architect, Developer, QA, Security, DevOps, Documentation,
Orchestrator). Seit dem Monorepo-Bootstrap ist das Repository ein echtes,
installierbares npm-Projekt mit lauffähigen (wenn auch noch frühen)
Grundgerüsten für alle drei Apps — kein reiner Konturwurf mehr:

```
npm install
npm run typecheck --workspaces
npm test --workspaces
```

Ein erster End-to-End-Testlauf der Agenten-Pipeline liegt ebenfalls vor
(Slug `lieferant-kontrakte-einsehen`, siehe [`docs/workflow/`](docs/workflow/))
und zeigt exemplarisch, wie die Rollen zusammenarbeiten.

## Tech-Stack

Durchgängig TypeScript:

- **Web** (`apps/web`): React
- **Mobile** (`apps/mobile`): React Native / Expo (Android + iOS)
- **API** (`apps/api`): Node.js / NestJS

Monorepo-Layout unter `apps/` (siehe
[ADR 0003](docs/architecture/adr/0003-monorepo-vs-polyrepo.md)): Web, Mobile
und API bleiben dauerhaft in einem Repository. Monorepo-Tooling, Test-Framework
und CI-Provider sind entschieden: npm-Workspaces, kein Turborepo/Nx
([ADR 0007](docs/architecture/adr/0007-npm-workspaces-als-monorepo-tooling.md)),
Jest einheitlich für alle drei Apps
([ADR 0005](docs/architecture/adr/0005-test-framework.md)), GitHub Actions
mit einer Pipeline fürs Monorepo
([ADR 0006](docs/architecture/adr/0006-github-actions-als-ci-provider.md)).
Der Authentifizierungsmechanismus für Lieferanten (ZITADEL Cloud, OIDC) ist
in seinen Grundzügen ebenfalls entschieden
([ADR 0004](docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md)),
Feindetails bleiben offen — siehe
[`docs/architecture/overview.md`](docs/architecture/overview.md), Abschnitt
"Offene technische Entscheidungen".

## Agenten-Team

| Rolle | Definition | Zuständigkeit | Output |
|---|---|---|---|
| Product Owner | [`.claude/agents/po.md`](.claude/agents/po.md) | Feature-Anfragen → User Stories + Akzeptanzkriterien | `docs/backlog/<slug>.md` |
| Architect | [`.claude/agents/architect.md`](.claude/agents/architect.md) | Technisches Design, ADRs, Systemgrenzen (inkl. Lobster/ERP) | `docs/architecture/adr/*.md` |
| Developer | [`.claude/agents/developer.md`](.claude/agents/developer.md) | Implementierung gemäß ADR und Backlog-Story | `apps/*` |
| QA | [`.claude/agents/qa.md`](.claude/agents/qa.md) | Testkonzept, Verifikation, DSGVO-Prüfpunkte | `docs/qa/<slug>.md` |
| Security | [`.claude/agents/security.md`](.claude/agents/security.md) | Bedrohungsanalyse, DSGVO/GDPR-Bewertung (nur lesend) | `docs/security/<slug>.md` |
| DevOps | [`.claude/agents/devops.md`](.claude/agents/devops.md) | CI/CD, Umgebungen, Rollout-/Secrets-Planung | `docs/devops/<slug>.md` |
| Documentation | [`.claude/agents/documentation.md`](.claude/agents/documentation.md) | Endnutzer- und Entwickler-Dokumentation | `docs/product/<slug>.md` |
| Orchestrator | [`.claude/agents/orchestrator.md`](.claude/agents/orchestrator.md) | Ad-hoc-Koordinationsfragen (führt die Pipeline **nicht** selbst aus) | — |

## Pipeline starten

Für ein vollständiges Feature (PO → Architect → Developer → QA → Security →
DevOps → Documentation) den Slash-Command ausführen:

```
/orchestrate <Feature-Beschreibung>
```

Der Command läuft im Hauptkontext (nicht als Subagent), da Subagenten in
Claude Code keine weiteren Subagenten aufrufen können. Details:
[`.claude/commands/orchestrate.md`](.claude/commands/orchestrate.md).

Für punktuelle Aufgaben können einzelne Agenten auch direkt angefragt werden
(z. B. "nutze den po-Agenten, um ...").

## Repository-Struktur

```
apps/
  web/      React Web-App
  mobile/   React Native / Expo App
  api/      NestJS Backend
docs/
  domain-glossar.md       Verbindliche Fachterminologie
  backlog/                PO-Ergebnisse (User Stories)
  architecture/adr/       Architect-Entscheidungen (ADRs)
  qa/                     QA-Berichte
  security/               Security-Berichte
  devops/                 DevOps-Notizen
  product/                Endnutzer-/Entwickler-Dokumentation
  workflow/               Konsolidierte Pipeline-Statusberichte
.claude/
  agents/                 Subagenten-Definitionen (8 Rollen)
  commands/               orchestrate.md (Pipeline-Slash-Command)
```

## Sensible Daten

Steuerbescheide, Prämien, Gutschriften und weitere finanzielle/personenbezogene
Lieferantendaten sind **DSGVO-relevant**. Alle Agenten behandeln sie
standardmäßig als sensibel: keine echten Lieferantendaten in Beispielen,
Fixtures oder Tests — ausschließlich klar erkennbare, synthetische Testdaten.
