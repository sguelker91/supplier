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

Der von Security als kritisch bemängelte Fehlbestand — kein tatsächlicher
Authentifizierungsmechanismus, `AuthenticatedSupplierContext` ohne
Herkunftsgarantie — ist nun größtenteils adressiert:
[ADR 0004](adr/0004-zitadel-oidc-authentifizierung.md) legt **ZITADEL Cloud**
als OIDC-Provider für den Lieferanten-Login fest, entscheidet ein
**tokenbasiertes Modell** (kein Session-Store in `apps/api`; JWT-Verifikation
gegen den ZITADEL-JWKS-Endpoint durch einen Guard, der daraus den
`AuthenticatedSupplierContext` aus ADR 0002 aufbaut) und legt **eine ZITADEL
Organization pro Lieferant** als Mandantenmodell fest, das die
Mandantentrennung aus ADR 0002 zusätzlich auf IdP-Ebene absichert (ohne die
dort entschiedene Guard-/Repository-Filterung zu ersetzen). Offen bleibt vor
Produktivbetrieb zwingend die Klärung von Datenresidenz (EU-Region bei
ZITADEL Cloud) und ein Auftragsverarbeitungsvertrag — als harte, in der ADR
dokumentierte Voraussetzung, nicht als getroffene Entscheidung.

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
- **ZITADEL Cloud**: externer OIDC-Identity-Provider für die
  Lieferanten-Authentifizierung ([ADR 0004](adr/0004-zitadel-oidc-authentifizierung.md)).
  `apps/api` überquert diese Grenze ausschließlich lesend zur
  JWT-Signaturprüfung (JWKS-Endpoint); Lieferanten-Identitätsdaten
  (Nutzer-Stammdaten, Organisationszugehörigkeit) werden bei ZITADEL Cloud
  gehalten. Datenresidenz/AVV sind vor Produktivbetrieb zwingend zu klären
  (siehe ADR 0004, Datenklassifizierung).

## Offene technische Entscheidungen

- Konkrete Monorepo-Tooling-Wahl innerhalb des mit
  [ADR 0003](adr/0003-monorepo-vs-polyrepo.md) bereits entschiedenen
  Monorepos (z. B. Turborepo, Nx, npm/pnpm-Workspaces) — die grundsätzliche
  Monorepo-vs.-Polyrepo-Frage selbst ist nicht mehr offen.
- Test-Framework(s) für Web/Mobile/API
- CI-Provider
- Feindetails des Authentifizierungsmechanismus für Lieferanten: IdP-Wahl
  (ZITADEL Cloud), Grundmodell (tokenbasiert, JWT-Verifikation gegen JWKS)
  und Mandantenmodell (eine ZITADEL Organization pro Lieferant) sind mit
  [ADR 0004](adr/0004-zitadel-oidc-authentifizierung.md) entschieden. Weiterhin
  offen: konkrete Token-Lebensdauer und Refresh-Strategie (inkl.
  Web- vs. Mobile-spezifischer Unterschiede), exakte
  ZITADEL-Projekt-/Applikationskonfiguration (Redirect-URIs,
  Scopes/Claims), das Mapping ZITADEL-Organization-ID ↔ interne
  `supplierId` sowie der Lieferanten-Onboarding-Prozess in ZITADEL, und
  die vor Produktivbetrieb zwingende Klärung von Datenresidenz/AVV mit
  ZITADEL. Der Autorisierungs-/Mandantentrennungs-**Teil** (wie ein
  bereits authentifizierter Lieferant serverseitig auf eigene Ressourcen
  beschränkt wird) bleibt unverändert in [ADR 0002](adr/0002-mandantentrennung-kontrakte.md)
  entschieden.
- Konkreter Transportmechanismus Lobster → `apps/api` für den
  Kontrakt-Ingestion-Adapter (siehe ADR 0001, offene Annahme).
