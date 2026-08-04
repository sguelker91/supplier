# Architektur-Übersicht: Lieferanten-Extranet

Lebendes Dokument — wird vom Architect-Agenten nach jedem Feature um eine
kurze "Aktueller Stand"-Notiz ergänzt. Ausführliche Entscheidungen stehen in
den ADRs unter [`adr/`](adr/).

## Aktueller Stand

Noch keine Architekturentscheidungen getroffen. Repository befindet sich in
der Harness-Aufbauphase (Agenten-Team, keine Anwendungsarchitektur).

## Bekannte Systemgrenzen

- **ERP-System**: führendes System für Stammdaten, Kontrakte, Belege.
  Integrationsdetails offen.
- **Lobster**: EDI-/Integrations-Middleware zwischen ERP und Extranet.
  Konkretes Anbindungsmuster (z. B. REST-Wrapper, Datei-Export/Import,
  Webhooks) ist Gegenstand einer künftigen ADR.

## Offene technische Entscheidungen

- Monorepo-Tooling (z. B. Turborepo, Nx, npm/pnpm-Workspaces)
- Test-Framework(s) für Web/Mobile/API
- CI-Provider
- Authentifizierungs-/Autorisierungsmodell für Lieferanten (Mandantentrennung)
