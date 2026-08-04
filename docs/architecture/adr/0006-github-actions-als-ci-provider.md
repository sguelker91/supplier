# 0006. GitHub Actions als CI-Provider, eine Pipeline für das Monorepo

## Status
Vorgeschlagen

## Kontext
`docs/architecture/overview.md` listet unter "Offene technische
Entscheidungen" bislang "CI-Provider" als vollständig offen.
`docs/devops/lieferant-kontrakte-einsehen.md` skizziert bereits einen
konkreten Pipeline-*Inhalt* (Lint/Type-Check, Unit-Tests, ein
Mandantentrennungs-Integrationstest als Merge-Gate,
Security-/Dependency-/Secret-Scanning), ausdrücklich **ohne** Tool-Wahl:
"Kein CI vorhanden — Vorschlag [...] Alle diese Schritte sind Vorschläge;
keiner ist heute als Workflow-Datei (z. B. GitHub Actions) im Repository
vorhanden." Diese ADR trifft die dort offen gelassene Provider-Wahl.

Relevante Ausgangslage:

- Das Repository liegt bereits auf GitHub (`sguelker91/supplier`).
  GitHub Actions ist damit ohne zusätzliche Konto-/Vertrags-/
  Datenaustausch-Beziehung mit einem weiteren externen Dienst nutzbar —
  der Code liegt bei GitHub bereits, ein zusätzlicher SaaS-CI-Anbieter
  (z. B. CircleCI) würde eine weitere externe Stelle mit Repository-Zugriff
  hinzufügen, ohne dass ein fachlicher Grund dafür erkennbar ist.
- [ADR 0003](0003-monorepo-vs-polyrepo.md) entscheidet das Monorepo u. a.
  mit dem Argument, CI-/Tooling-Overhead auf **eine** Pipeline statt N
  getrennte zu konzentrieren ("optional mit Path-Filtering pro App").
  Diese ADR muss diese Vorgabe konkretisieren.
- [ADR 0004](0004-zitadel-oidc-authentifizierung.md) etabliert ein
  tokenbasiertes Auth-Modell gegen ZITADEL Cloud und definiert bereits ein
  runner-/framework-unabhängiges `TokenVerifier`-Interface
  (`apps/api/src/auth/token-verifier.interface.ts`) als Vertrag für die
  JWKS-Signaturprüfung, getrennt von einer konkreten Implementierung. Für
  CI stellt sich dadurch die Frage, ob Tests gegen die echte ZITADEL-Cloud-
  Instanz laufen (mit den entsprechenden Secrets-Handling-Konsequenzen) oder
  gegen eine Testimplementierung dieses Interfaces.
- [ADR 0005](0005-test-framework.md) legt Jest als einheitliches
  Test-Framework für `apps/api`, `apps/web` und `apps/mobile` fest — diese
  ADR baut darauf auf, statt den Runner erneut zu verhandeln.

## Entscheidung

### 1. Provider: GitHub Actions
**GitHub Actions** wird als CI-Provider für das Lieferanten-Extranet
festgelegt.

Begründung:

1. **Kein zusätzlicher externer Dienst.** Das Repository liegt bereits bei
   GitHub; GitHub Actions läuft im selben Vertrauens- und
   Berechtigungsmodell (GitHub-Repository-Permissions, GitHub-Secrets),
   ohne dass Code oder Zugriffsrechte einem weiteren SaaS-Anbieter
   eingeräumt werden müssen. Das reduziert die Zahl der Stellen, an denen
   potenziell sensible Konfiguration (siehe Abschnitt 3) verwaltet werden
   muss.
2. **Native Monorepo-/Path-Filtering-Unterstützung**, passend zu ADR 0003:
   GitHub Actions erlaubt sowohl Trigger-seitiges Path-Filtering
   (`on.push.paths` / `on.pull_request.paths`) als auch job-interne
   Bedingungen und Matrix-Builds (z. B. ein Job pro App
   `[api, web, mobile]`) **innerhalb einer einzigen, im Repository
   versionierten Pipeline-Definition** — ohne N getrennte CI-Systeme oder
   -Konten, wie es bei einer Kombination aus mehreren Provider-Insellösungen
   nötig wäre.
3. **Ausreichend für die aktuell bekannten Anforderungen.** Die von DevOps
   vorgeschlagenen Stufen (Lint/Type-Check, Unit-Tests, HTTP-Layer-
   Integrationstest als Merge-Gate, Dependency-/Secret-Scanning, Build)
   sind Standardfunktionalität von GitHub Actions (u. a. über
   Branch-Protection-Regeln mit "required status checks" für das
   Merge-Gate) ohne Sonderanforderung, die einen anderen Provider nötig
   machen würde.
4. **Team-Realität.** Wie in ADR 0003 (Kriterium 3/4) begründet, gibt es
   aktuell ein Ein-Personen-Team plus Agenten-Pipeline, kein getrenntes
   Infrastruktur-/Platform-Team. Ein selbstgehosteter CI-Server (z. B.
   Jenkins) würde Betriebsaufwand (Wartung, Patching, Skalierung)
   erzeugen, dem aktuell kein Gegenwert gegenübersteht. GitHub-gehostete
   Runner werden daher als Ausgangspunkt angenommen; selbstgehostete
   Runner sind nicht ausgeschlossen, aber nicht Gegenstand dieser
   Entscheidung (siehe "Offene Punkte").

**Geprüfte, nicht gewählte Alternativen:**
- **GitLab CI**: würde eine Migration/Spiegelung der Repository-Hosting-
  Plattform erfordern, ohne dass ein fachlicher Vorteil für dieses Projekt
  erkennbar ist — abgelehnt.
- **CircleCI/Travis CI o. Ä.**: zusätzlicher externer SaaS-Dienst mit
  eigenem Zugriffsmodell auf das Repository, ohne erkennbaren Vorteil
  gegenüber der bereits vorhandenen GitHub-Integration — abgelehnt.
- **Selbstgehostetes CI (Jenkins o. Ä.)**: unverhältnismäßiger
  Betriebsaufwand für die aktuelle Team-Größe (siehe Begründung 4) —
  abgelehnt für den jetzigen Zeitpunkt; keine dauerhafte Festlegung gegen
  einen späteren Wechsel, falls z. B. Netzwerkzugriff auf eine interne
  ERP-/Lobster-Sandbox einen selbstgehosteten Runner erfordert (siehe
  "Offene Punkte").

### 2. Pipeline-Struktur: eine logische Pipeline für das Monorepo
Konsistent mit ADR 0003 wird **eine** Pipeline-Definition für das gesamte
Repository festgelegt, nicht drei getrennte, unabhängig verwaltete
CI-Konfigurationen pro App:

- Eine (oder eine kleine, thematisch gruppierte Anzahl) GitHub-Actions-
  Workflow-Datei(en) unter `.github/workflows/` im selben Repository,
  ausgelöst durch Push/Pull-Request auf den Haupt-Branch bzw. Feature-
  Branches.
- Innerhalb dieser Pipeline werden App-spezifische Schritte (Lint/Test/
  Build für `apps/api`, `apps/web`, `apps/mobile`) als eigene Jobs bzw.
  Matrix-Einträge abgebildet, **nicht** als separate, unabhängig
  getriggerte CI-Systeme. Path-Filtering (z. B. nur `apps/mobile`-Job bei
  Änderungen unter `apps/mobile/**` ausführen) ist damit möglich, ändert
  aber nichts daran, dass es sich um eine gemeinsame Pipeline-Definition
  handelt.
- Der von DevOps als **Merge-Gate** geforderte Mandantentrennungstest
  (`apps/api`, HTTP-Layer, siehe ADR 0005) wird als "required status
  check" in den GitHub-Branch-Protection-Regeln für den Haupt-Branch
  konfiguriert, sobald der Test existiert — die konkrete Branch-Protection-
  Konfiguration ist Umsetzungsdetail, nicht Gegenstand dieser ADR.

### 3. Kein CI-Testlauf gegen eine echte ZITADEL-Cloud-Instanz
Für Tests, die den in ADR 0004 definierten Auth-Guard/`TokenVerifier`
betreffen, wird entschieden: **CI führt keine Tests gegen die echte
ZITADEL-Cloud-Instanz aus.** Stattdessen werden solche Tests gegen eine
Test-/Fake-Implementierung des bereits in ADR 0004 definierten
`TokenVerifier`-Interfaces geführt (z. B. eine Implementierung, die
selbst-signierte Test-Tokens mit einem im Testprozess erzeugten
Schlüsselpaar verifiziert, statt den echten ZITADEL-JWKS-Endpoint
aufzurufen).

Begründung:
- Vermeidet, dass echte ZITADEL-Client-Konfiguration (Issuer, Client-ID,
  s. ADR 0004 "Implementierungsnotizen") oder gar Zugangsdaten für einen
  Test-Account als CI-Secret hinterlegt werden müssten — geringere
  Angriffsfläche und kein Bedarf an einem eigenen ZITADEL-Test-Mandanten
  nur für CI.
- Vermeidet CI-Flakiness durch Abhängigkeit von der Erreichbarkeit eines
  externen Drittdienstes bei jedem Pipeline-Lauf.
- Ist bereits durch das in ADR 0004 bewusst interface-basiert entworfene
  `TokenVerifier` architektonisch vorbereitet (das Interface trennt
  Verifikationslogik von der konkreten JWKS-Implementierung genau zu
  diesem Zweck) — diese ADR nutzt diese bestehende Trennung, erfindet sie
  nicht neu.
- **Konsequenz/Abgrenzung:** Ein solcher CI-Test verifiziert damit das
  Verhalten von `apps/api` bei einem *gültig signierten* Token
  (Guard-Logik, `AuthenticatedSupplierContext`-Aufbau, Mandantentrennung),
  **nicht** die tatsächliche Kompatibilität mit der realen
  ZITADEL-Cloud-Konfiguration (Issuer-String, Claim-Namen,
  Organization-Mapping). Diese Lücke ist bewusst in Kauf genommen und
  sollte, sobald ein Staging-Environment gegen echtes ZITADEL existiert
  (siehe DevOps-Umgebungsstrategie), durch einen ergänzenden, nicht in
  jedem CI-Lauf ausgeführten Staging-Smoke-Test abgedeckt werden — das ist
  nicht Gegenstand dieser ADR.

### 4. Secret-Scanning bleibt Pipeline-Bestandteil, konkretes Tool offen
Der von DevOps geforderte Secret-Scanning-Schritt (Vermeidung von
versehentlich eingecheckten ERP-/Lobster-Zugangsdaten) wird als
Pflichtbestandteil der GitHub-Actions-Pipeline bestätigt. Die konkrete
Tool-Wahl (z. B. GitHub Advanced Security Secret Scanning als
GitHub-natives Feature vs. ein zusätzliches Marketplace-Action wie
Gitleaks) wird durch diese ADR **nicht** getroffen — beide sind mit
GitHub Actions vereinbar; die Wahl ist ein Umsetzungsdetail, das keine
Grundsatzentscheidung über den Provider hinaus erfordert.

## Konsequenzen
- `.github/workflows/` wird der Ort für die künftige(n) Pipeline-
  Definition(en). Es wird durch diese ADR **keine** Workflow-Datei
  angelegt — das ist ausdrücklich nicht Teil dieses Auftrags und bleibt
  Aufgabe einer künftigen DevOps-/Developer-Umsetzung.
- Die CI-Pipeline nutzt den in ADR 0005 festgelegten Jest-Runner für alle
  Test-Stufen; diese ADR erfindet keinen eigenen, CI-spezifischen
  Test-Mechanismus.
- Secrets (ERP-/Lobster-Zugangsdaten für Staging/Prod-Deployments, sobald
  relevant) werden, falls in CI überhaupt benötigt, über GitHub-Actions-
  Secrets/Environments verwaltet — konsistent mit dem in
  `docs/devops/lieferant-kontrakte-einsehen.md` skizzierten Prinzip
  "zentraler Secret-Manager statt Klartext", wobei GitHub Actions
  Environments mit Schutzregeln (z. B. Required Reviewers für
  Prod-Deployments) als GitHub-natives Mittel hierfür dienen können. Die
  konkrete Ausgestaltung bleibt DevOps-Story-Scope.
- Für Auth-bezogene Tests wird **kein** CI-seitiger ZITADEL-Cloud-Zugang
  benötigt (siehe Entscheidung Punkt 3) — das vereinfacht das
  Secrets-Handling für den Regelfall, lässt aber eine reale
  Staging-gegen-ZITADEL-Prüfung außerhalb der Standard-CI-Pipeline offen.
- **Risiko, explizit benannt:** Sollte künftig ein Integrationstest gegen
  eine echte ERP-/Lobster-Sandbox-Instanz (siehe DevOps-Umgebungsstrategie,
  Staging-Zeile) in die Standard-CI-Pipeline aufgenommen werden sollen und
  diese Sandbox nur aus einem internen Netz erreichbar sein
  (unbekannt/nicht verifiziert), reichen GitHub-gehostete Runner ggf. nicht
  aus und ein selbstgehosteter Runner mit Netzwerkzugriff wäre nötig. Das
  ist eine offene, hier nicht spekulativ vorweggenommene Annahme über die
  ERP-/Lobster-Netzwerktopologie.

## Offene Punkte (bewusst nicht Teil dieser ADR)
- Konkrete Workflow-YAML-Struktur, Job-/Matrix-Aufteilung im Detail,
  konkrete Marketplace-Actions.
- Coverage-Schwellen und ob/wie sie als Merge-Gate durchgesetzt werden.
- Deployment-/CD-Ziele (Staging/Prod-Rollout-Mechanismus) — diese ADR
  entscheidet ausschließlich CI (Lint/Test/Build/Scan), keine
  Deployment-Pipeline; das bleibt konkreter DevOps-Story-Scope für ein
  gegebenes Feature.
- Selbstgehostete Runner vs. GitHub-gehostete Runner für einen möglichen
  künftigen ERP-/Lobster-Sandbox-Integrationstest (siehe Risiko oben).
- Konkretes Secret-Scanning-Tool (GitHub-natives Feature vs.
  Marketplace-Action).
- Ob/wie CI zusätzlich die Agenten-Harness selbst prüft (z. B.
  YAML-Frontmatter-Validierung der Definitionen unter `.claude/agents/*.md`
  oder Struktur-Checks für `docs/backlog/*.md`). Das wäre technisch mit
  GitHub Actions umsetzbar, ist aber durch keine aktuelle Story
  gefordert und wird hier nur als mögliche künftige Erweiterung vermerkt,
  nicht entschieden.

## Datenklassifizierung
Diese ADR selbst führt keine neue fachliche Datenverarbeitung ein, betrifft
aber, welche Daten die CI-Pipeline potenziell verarbeitet/loggt:

- **Lieferant** (`Supplier`) und **Kontrakt** (`Contract`): DSGVO-/
  kommerziell sensibel laut Domain-Glossar. CI-Läufe dürfen laut
  `CLAUDE.md` ("Sensible Daten") ausschließlich mit synthetischen
  Test-Fixtures dieser Entitäten arbeiten, nie mit echten
  Lieferantendaten — diese ADR ändert daran nichts, bestätigt es aber
  als Rahmenbedingung für die künftige Pipeline (u. a. Grund für die in
  Punkt 3 getroffene Entscheidung, keine echte ZITADEL-Cloud-Instanz mit
  ggf. echten Organisations-/Nutzerdaten in CI anzusprechen).
- **Steuerbescheid**, **Prämie**, **Gutschrift**: hochsensibel/finanziell
  laut Domain-Glossar; aktuell nicht Gegenstand einer Story, aber bei
  künftigen CI-Tests für Belege-Storys gilt dieselbe
  Synthetische-Daten-Pflicht.
- CI-Logs selbst gelten als potenzielle Leck-Quelle: der von DevOps
  geforderte Secret-Scanning-Schritt sowie das Verbot, ERP-/Lobster-
  Antwortpayloads oder Zugangsdaten zu loggen, gilt unverändert auch für
  CI-Job-Logs (nicht nur Anwendungs-Logs).
