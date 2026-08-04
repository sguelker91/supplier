# Architektur-Übersicht: Lieferanten-Extranet

Lebendes Dokument — wird vom Architect-Agenten nach jedem Feature um eine
kurze "Aktueller Stand"-Notiz ergänzt. Ausführliche Entscheidungen stehen in
den ADRs unter [`adr/`](adr/).

## Aktueller Stand

Erste Architekturentscheidungen liegen vor, ausgelöst durch die Story
"Lieferant kann seine Kontrakte einsehen" ([ADR 0001](adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md),
[ADR 0002](adr/0002-mandantentrennung-kontrakte.md)). `apps/api` wird als
alleiniger Datenhalter für das Extranet-Lesemodell von Kontrakten
festgelegt (eigene `Contract`-Persistenz inkl. Sync-Status-Metadaten,
befüllt aus Lobster über einen noch zu definierenden Ingestion-Adapter);
`apps/web` liest ausschließlich von `apps/api`, nie direkt von
ERP/Lobster. Für lieferantenscoped Ressourcen (aktuell: Kontrakte) ist das
serverseitige Autorisierungsmuster (Guard + Repository-Filter anhand einer
verifizierten `supplierId`, keine Supplier-ID im Client-Input) entschieden.

Zusätzlich ist die bislang nur implizit angenommene Repository-Struktur nun
explizit begründet entschieden: [ADR 0003](adr/0003-monorepo-vs-polyrepo.md)
bestätigt ein **Monorepo** (`apps/web`, `apps/mobile`, `apps/api`, `docs/`,
`.claude/` in einem Repository) gegenüber Polyrepo, hauptsächlich wegen
geteilter TypeScript-Contracts zwischen `apps/api` und den Frontends,
atomarer Cross-App-Änderungen und der Agenten-Pipeline, die auf relative
Dateipfade innerhalb eines Repos angewiesen ist. Die konkrete
Monorepo-*Tooling*-Wahl (Turborepo/Nx/Workspaces) bleibt davon unabhängig
offen.

## Bekannte Systemgrenzen

- **ERP-System**: führendes System für Stammdaten, Kontrakte, Belege.
  Integrationsdetails größtenteils offen; für Kontrakte legt
  [ADR 0001](adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
  den von `apps/api` erwarteten Datenkontrakt fest (nicht die
  ERP-interne Funktionsweise).
- **Lobster**: EDI-/Integrations-Middleware zwischen ERP und Extranet.
  [ADR 0001](adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
  definiert für Kontraktdaten, welche Felder und Sync-Metadaten die
  Grenze überqueren müssen. Das konkrete Transportmuster (z. B.
  REST-Wrapper, Datei-Export/Import, Webhooks) ist weiterhin offen und
  muss vor Umsetzung eines Ingestion-Adapters geklärt werden.

## Offene technische Entscheidungen

- Konkrete Monorepo-Tooling-Wahl innerhalb des mit
  [ADR 0003](adr/0003-monorepo-vs-polyrepo.md) bereits entschiedenen
  Monorepos (z. B. Turborepo, Nx, npm/pnpm-Workspaces) — die grundsätzliche
  Monorepo-vs.-Polyrepo-Frage selbst ist nicht mehr offen.
- Test-Framework(s) für Web/Mobile/API
- CI-Provider
- Konkreter Authentifizierungsmechanismus für Lieferanten (Login-Flow,
  Token- vs. Session-Modell, IdP-Wahl, Token-Lebensdauer). Der
  Autorisierungs-/Mandantentrennungs-**Teil** (wie ein bereits
  authentifizierter Lieferant serverseitig auf eigene Ressourcen
  beschränkt wird) ist für lieferantenscoped Ressourcen bereits in
  [ADR 0002](adr/0002-mandantentrennung-kontrakte.md) entschieden.
- Konkreter Transportmechanismus Lobster → `apps/api` für den
  Kontrakt-Ingestion-Adapter (siehe ADR 0001, offene Annahme).
