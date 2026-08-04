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

Zwei der bislang offenen Werkzeug-Grundsatzfragen sind nun ebenfalls
entschieden: [ADR 0005](adr/0005-test-framework.md) legt **Jest** als
einheitliches Test-Framework für `apps/api`, `apps/web` **und**
`apps/mobile` fest (statt unterschiedlicher Runner je App), vor allem weil
Expo/React Native de facto auf Jest angewiesen ist und ein einheitlicher
Runner die Monorepo-Konsistenz aus ADR 0003 stützt.
[ADR 0006](adr/0006-github-actions-als-ci-provider.md) legt **GitHub
Actions** als CI-Provider fest (das Repository liegt bereits auf GitHub)
mit **einer** logischen Pipeline für das gesamte Monorepo statt getrennter
CI-Systeme je App, und entscheidet zusätzlich, dass CI-Auth-Tests gegen
eine Test-Implementierung des in ADR 0004 definierten
`TokenVerifier`-Interfaces laufen, nicht gegen die echte ZITADEL-Cloud-
Instanz. Beide ADRs treffen ausschließlich die Grundsatzentscheidung;
konkrete Workflow-Dateien, Test-Setup-Code, Coverage-Schwellen und
Deployment-/CD-Ziele wurden bewusst **nicht** angelegt.

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
  (siehe ADR 0004, Datenklassifizierung). In CI wird diese Grenze bewusst
  **nicht** überquert (siehe [ADR 0006](adr/0006-github-actions-als-ci-provider.md),
  Punkt 3): Auth-Tests laufen gegen eine Test-Implementierung des
  `TokenVerifier`-Interfaces, nicht gegen die echte ZITADEL-Cloud-Instanz.

## Zukünftige Anforderungen (noch nicht im Scope)

- **Gastbenutzer je Lieferant**: Lieferanten sollen künftig eigene
  "Gastbenutzer" anlegen können, z. B. für Steuerberater, Speditionen oder
  eigene Mitarbeiter, die im Auftrag des Lieferanten auf das Extranet
  zugreifen. Noch nicht als Backlog-Story ausgearbeitet — hier nur als
  Anforderung vorgemerkt, damit sie bei künftigen Architekturentscheidungen
  mitgedacht wird. Direkter Bezug zu [ADR 0004](adr/0004-zitadel-oidc-authentifizierung.md):
  Das dort gewählte Modell "eine ZITADEL Organization pro Lieferant"
  unterstützt grundsätzlich mehrere Nutzer je Organization, was für
  Gastbenutzer mit eingeschränkten Rollen/Rechten passend erscheint — die
  konkrete Rollen-/Rechte-Ausgestaltung (z. B. welche Belege/Kontrakte ein
  Gastbenutzer sehen darf) ist jedoch nicht entschieden und erfordert eine
  eigene Story/ADR, sobald sie priorisiert wird.

## Offene technische Entscheidungen

- Konkrete Monorepo-Tooling-Wahl innerhalb des mit
  [ADR 0003](adr/0003-monorepo-vs-polyrepo.md) bereits entschiedenen
  Monorepos (z. B. Turborepo, Nx, npm/pnpm-Workspaces) — die grundsätzliche
  Monorepo-vs.-Polyrepo-Frage selbst ist nicht mehr offen.
- Test-Framework(s) für Web/Mobile/API und CI-Provider sind mit
  [ADR 0005](adr/0005-test-framework.md) (Jest, einheitlich für alle drei
  Apps) und [ADR 0006](adr/0006-github-actions-als-ci-provider.md) (GitHub
  Actions, eine Pipeline für das Monorepo) entschieden. Weiterhin offen und
  bewusst nicht Teil dieser beiden ADRs: konkrete Workflow-YAML-Struktur,
  Coverage-Schwellen, Transpiler-/Preset-Details (`ts-jest`/`@swc/jest`/
  `jest-expo`), ein browserbasiertes E2E-Test-Framework für `apps/web`
  (z. B. Playwright/Cypress), konkretes Secret-Scanning-Tool,
  selbstgehostete vs. GitHub-gehostete Runner (relevant, falls künftig ein
  CI-Test gegen eine interne ERP-/Lobster-Sandbox nötig wird) sowie
  Deployment-/CD-Ziele (reines CI-Scope, keine Aussage zu Rollout-
  Mechanismen).
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
