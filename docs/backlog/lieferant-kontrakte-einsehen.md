# Lieferant kann seine Kontrakte in der Extranet-Weboberfläche einsehen

## Kontext
Kontrakte werden im führenden ERP-System gepflegt und über die
Middleware Lobster an das Lieferanten-Extranet übertragen. Bisher haben
Lieferanten keinen Selbstbedienungs-Zugriff auf ihre eigenen Kontrakte in
der Web-Oberfläche des Extranets und müssen diese Informationen aktuell
über andere Kanäle (z. B. Sachbearbeiter, E-Mail, Papier) erhalten. Diese
Story schafft eine reine Leseansicht der Kontrakte für den eingeloggten
Lieferanten.

**Hinweis:** Kontrakt-Daten sind laut Domain-Glossar als "kommerziell"
und damit finanziell/DSGVO-sensibel eingestuft. Security und QA müssen
gezielt auf Mandantentrennung und Zugriffsschutz prüfen.

## User Story
Als Lieferant möchte ich meine Kontrakte in der Extranet-Weboberfläche
einsehen können, damit ich jederzeit selbstständig einen aktuellen
Überblick über meine vereinbarten Liefermengen und -konditionen habe,
ohne dafür Rückfragen stellen zu müssen.

## Akzeptanzkriterien

1. **Given** ein Lieferant ist erfolgreich in der Extranet-Weboberfläche
   eingeloggt, **when** er den Menüpunkt "Kontrakte" aufruft, **then**
   wird ihm eine Liste seiner eigenen Kontrakte angezeigt, die aus dem
   ERP-System über Lobster ins Extranet übertragen wurden.
2. **Given** ein Lieferant hat mehrere Kontrakte, **when** die Liste
   angezeigt wird, **then** enthält jede Zeile mindestens Kontraktnummer,
   Artikel/Warengruppe, vereinbarte Liefermenge, Gültigkeitszeitraum
   (von/bis) und Status (z. B. aktiv, abgelaufen).
3. **Given** ein Lieferant öffnet einen Kontrakt aus der Liste, **when**
   die Detailansicht geladen wird, **then** werden alle im ERP-System
   hinterlegten Kontraktkonditionen (u. a. Preis-/Mengenkonditionen) für
   genau diesen Kontrakt angezeigt.
4. **Given** ein Lieferant ist eingeloggt, **when** er auf die
   Kontrakt-Liste oder -Detailansicht zugreift, **then** werden
   ausschließlich Kontrakte angezeigt, die diesem Lieferanten
   zugeordnet sind (Mandantentrennung); ein Zugriff auf Kontrakte
   anderer Lieferanten (z. B. über direkte URL-/ID-Manipulation) wird
   serverseitig abgelehnt und mit einem Fehlerstatus (z. B. 403)
   quittiert.
5. **Given** für einen Lieferanten sind aktuell keine Kontrakte im
   Extranet vorhanden, **when** er die Kontrakt-Liste aufruft, **then**
   wird ein klarer Leer-Zustand ("Keine Kontrakte vorhanden") angezeigt
   statt einer Fehlermeldung oder eines leeren weißen Bildschirms.
6. **Given** die Synchronisation von Kontraktdaten aus dem ERP-System
   über Lobster ist fehlgeschlagen oder veraltet, **when** der Lieferant
   die Kontrakt-Liste aufruft, **then** wird ein Hinweis auf den
   Stand/Zeitpunkt der letzten erfolgreichen Datenaktualisierung
   angezeigt (kein stillschweigendes Anzeigen veralteter Daten ohne
   Kennzeichnung).
7. **Given** ein Lieferant ist nicht eingeloggt oder seine Sitzung ist
   abgelaufen, **when** er versucht, die Kontrakt-Liste oder eine
   Kontrakt-Detailansicht aufzurufen, **then** wird er zur
   Anmeldeseite weitergeleitet und es werden keine Kontraktdaten
   ausgeliefert.
8. **Given** ein Kontrakt ist abgelaufen, **when** die Liste angezeigt
   wird, **then** ist dieser Kontrakt eindeutig als "abgelaufen"
   gekennzeichnet und von aktiven Kontrakten optisch/inhaltlich
   unterscheidbar.

## Implementierungsnotizen

**Status: Konturwurf/Prototyp, nicht lauffähig.** Wie im Auftrag
explizit vorgesehen, wurde bewusst KEINE vollständige, ausführbare
Implementierung gebaut, da laut `docs/architecture/overview.md`
("Offene technische Entscheidungen") noch keine ADR zu
Monorepo-Tooling, Test-Framework(s) oder dem konkreten
Authentifizierungsmechanismus vorliegt. Es existiert aktuell weder ein
`package.json` noch ein NestJS- bzw. React-Projekt unter `apps/*` — nur
READMEs. Diese Implementierung erfindet diese Architektur nicht im
Alleingang, sondern skizziert ausschließlich die Strukturen, die aus
ADR 0001 und ADR 0002 bereits konkret ableitbar sind.

**Was gebaut wurde:**

- `apps/api/src/contracts/contract.types.ts` — TypeScript-Typen für
  den Datenkontrakt aus ADR 0001 Punkt 2 (`IncomingContractRecord`,
  `Contract`, `ContractCondition`, `Quantity`), die Sync-Metadaten aus
  ADR 0001 Punkt 3 (`ContractSyncRun`, `ContractSyncMeta` mit
  `lastSuccessfulSyncAt`/`isStale`), die API-Lesemodelle
  (`ContractListResponse`, `ContractDetailResponse`) sowie
  `AuthenticatedSupplierContext` gemäß ADR 0002 Punkt 1.
- `apps/api/src/contracts/contract-repository.interface.ts` —
  Repository-Interface, das das in ADR 0002 Punkt 3 geforderte
  Defense-in-Depth-Muster sichtbar macht (`findManyForSupplier` immer
  supplier-gefiltert; `findById` bewusst ungefiltert, ausschließlich
  für die Existenzprüfung nach ADR 0002 Punkt 4).
- `apps/api/src/contracts/contracts.service.ts` — lauffähiger,
  framework-unabhängiger TypeScript-Service, der die Kernlogik aus
  ADR 0002 Punkt 4 konkret umsetzt: `supplierId` wird ausschließlich
  aus dem Auth-Kontext gelesen, und `getMyContractById` unterscheidet
  `not_found` (404) von `forbidden` (403) exakt wie in der ADR
  festgelegt. Ownership-Prüfung erfolgt serverseitig anhand
  `contract.supplierId !== auth.supplierId`.
- `apps/web/src/contracts/ContractsListPage.tsx` — Platzhalter-
  Komponente, die zeigt, wie die Liste aus `ContractListResponse`
  gerendert würde: Pflichtspalten aus AC2, Leer-Zustand (AC5),
  Sync-Stand-Hinweis inkl. Veraltet-Kennzeichnung (AC6) und optische/
  inhaltliche Unterscheidung abgelaufener Kontrakte (AC8).

**Wo die Umsetzung von den ADRs abweicht bzw. bewusst unvollständig
bleibt, und warum:**

- **Kein Framework-Code (NestJS-Decorators, Controller, Guards,
  React-Rendering-Runtime).** ADR 0002 sieht einen
  Autorisierungs-Guard plus Controller-Routen (`GET /contracts`,
  `GET /contracts/:contractId`) vor. Da NestJS noch nicht als
  Dependency im Repo existiert, wurde die Autorisierungslogik als
  reiner TypeScript-Service (`ContractsService`) ohne
  Framework-Bindung geschrieben. Sobald Monorepo-/Framework-Tooling
  entschieden ist, sollte dieser Service 1:1 in einen
  `@Injectable()`-Service übernommen und von einem dünnen
  `@Controller()` + `AuthGuard` umschlossen werden, der lediglich
  `AuthenticatedSupplierContext` aus dem Request extrahiert.
- **Keine echte Persistenz.** `ContractRepository` ist nur ein
  Interface, keine DB-Anbindung (kein ORM/Datenbank-Entscheidung
  vorhanden). `Contract`/`ContractSyncRun` als Tabellen sind laut
  ADR 0001 vorgesehen, aber nicht angelegt.
- **Kein Ingestion-Adapter Lobster → apps/api.** Laut ADR 0001 Punkt 4
  ist der Transportmechanismus explizit offen; es gibt daher keinen
  Code, der `IncomingContractRecord` befüllt.
- **Keine Auth-Integration.** `AuthenticatedSupplierContext` ist nur
  ein Typ; es gibt keinen Login-Flow, keine Session-/Token-Verifikation
  und keine Middleware, die diesen Kontext aus einem Request erzeugt
  (ADR 0002, offene Annahme). AC7 (Redirect zur Anmeldeseite bei
  fehlender/abgelaufener Session) ist dadurch nicht umgesetzt.
- **`ContractCondition` bleibt generisch** (Label/Wert/Einheit-Modell),
  wie in ADR 0001 ("Konsequenzen") explizit empfohlen, da der
  vollständige Feldkatalog für Preis-/Mengenkonditionen laut Backlog
  ("Offene Fragen") noch nicht geklärt ist.
- **`ContractStatus`-Herkunft:** `contract.types.ts` sieht sowohl ein
  optionales ERP-Statusfeld (`IncomingContractRecord.status: string`)
  als auch einen normalisierten lokalen Status (`Contract.status:
  'active' | 'expired'`) vor, aber es gibt keine implementierte
  Ableitungslogik (`validTo` vs. aktuelles Datum) — das ist als TODO im
  Code markiert.
- **`apps/web`-Komponente rendert nur die Liste**, keine Detailansicht
  (AC3), keine 403-Fehlerbehandlung bei URL-Manipulation (AC4) und
  kein Menüpunkt/Routing (AC1) — das erfordert Web-Framework-/Routing-
  Entscheidungen, die noch ausstehen.
- **Keine Tests.** Es ist kein Test-Framework für `apps/web`/`apps/api`
  entschieden (siehe `docs/architecture/overview.md`); daher wurden
  keine automatisierten Tests hinzugefügt. Sobald ein Framework
  feststeht, sollten mindestens folgende Fälle abgedeckt werden:
  Listen-/Detail-Autorisierung (403 vs. 404 vs. 200), Leer-Zustand
  (AC5), Stale-Kennzeichnung (AC6) und Abgelaufen-Kennzeichnung (AC8).
- **Keine Fixtures/Testdaten mit echten Werten verwendet** — die
  Codebeispiele enthalten ausschließlich Typdefinitionen ohne
  konkrete Beispieldaten; sollten künftig Fixtures ergänzt werden,
  sind ausschließlich offensichtlich synthetische Platzhalterwerte zu
  verwenden.

## Betroffene Domänenbegriffe
- Lieferant
- Kontrakt
- Lobster
- ERP-System

## Nicht-Ziele
- Kein Bearbeiten, Anlegen oder Löschen von Kontrakten durch den
  Lieferanten (reine Leseansicht).
- Keine Freigabe- oder Genehmigungsworkflows für Kontraktänderungen.
- Keine Darstellung von Kontrakten anderer Lieferanten, auch nicht für
  interne Sachbearbeiter im Rahmen dieser Story (separate interne
  Ansicht wäre eigene Story).
- Kein Export (PDF/CSV/Excel) der Kontraktliste — falls gewünscht,
  eigene Folge-Story.
- Keine Verknüpfung/Anzeige von Abnahmescheinen, Mengenmeldungen oder
  Gutschriften innerhalb der Kontraktansicht (eigenständige Belegtypen,
  eigene Stories).
- Keine mobile App-Umsetzung (Scope ist ausschließlich die
  Web-Oberfläche des Extranets).
- Keine Änderung an der Lobster-Synchronisationslogik selbst; es wird
  vorausgesetzt, dass Kontraktdaten bereits über bestehende
  Schnittstellen ins Extranet gelangen.

## Offene Fragen
- Welche Kontraktattribute aus dem ERP-System gelten als
  freigegeben/erforderlich für die Anzeige im Extranet (vollständiger
  Feldkatalog), und gibt es Felder, die aus Vertraulichkeitsgründen
  bewusst NICHT angezeigt werden dürfen?
- Wie ist der Umgang mit historischen/abgelaufenen Kontrakten geregelt —
  werden diese zeitlich unbegrenzt angezeigt oder nach einer definierten
  Frist ausgeblendet/archiviert?
- Wie wird die Mandantentrennung technisch abgesichert (z. B.
  Autorisierung pro Kontrakt-ID serverseitig vs. rein
  UI-seitige Filterung)? Bedarf Klärung mit Architect/Security.
- Wie aktuell müssen die Kontraktdaten sein (Synchronisationsintervall
  über Lobster), und wie wird dem Lieferanten der Datenstand
  kommuniziert?
- Gibt es rechtliche/vertragliche Vorgaben (z. B. aus
  Lieferantenverträgen), die eine Einsicht bestimmter Kontraktdetails
  im Extranet einschränken?
- Wird für diese Story ein Audit-Log für Lesezugriffe auf Kontrakte
  benötigt (Compliance-Anforderung), analog zu anderen sensiblen
  Datentypen im Glossar?
- Sollen Sachbearbeiter im Rahmen dieser Story bereits eine
  eingeschränkte "Anzeigen als Lieferant"-Funktion erhalten, oder ist
  das explizit außerhalb des Scopes (siehe Nicht-Ziele)?

## Implementierungsnotizen (Monorepo-Bootstrap: lauffähiges Grundgerüst)

**Status: lauffähig.** Der bisherige framework-freie Konturwurf (siehe
Implementierungsnotiz oben) wurde in ein echtes, installierbares
npm-Workspaces-Monorepo überführt: `npm install` im Root läuft sauber durch
(verifiziert inkl. vollständig frischem `node_modules`/`package-lock.json`),
und `npm run typecheck` sowie `npm run test` sind für alle drei Workspaces
grün (`apps/api`: 19 Tests/3 Suiten, `apps/web`: 4 Tests/1 Suite,
`apps/mobile`: 1 Test/1 Suite). `apps/web` baut zusätzlich sauber über
`vite build`, `apps/api` über `nest build`.

**Was gebaut wurde:**

- **Root**: `package.json` mit `"workspaces": ["apps/api", "apps/web",
  "apps/mobile"]` (ADR 0007, npm-Workspaces, kein Turborepo/Nx-Config).
- **`apps/api` (NestJS, ADR 0002/ADR 0004)**:
  - `ContractsController` ist jetzt ein echter `@Controller('contracts')`
    mit `@Get()`/`@Get(':contractId')` und `@UseGuards(ZitadelAuthGuard)`;
    Statuscode-Mapping (401 via Guard, 403/404/200 via
    `NotFoundException`/`ForbiddenException`) unverändert aus ADR 0002
    Punkt 4 übernommen.
  - `ZitadelAuthGuard implements CanActivate` nutzt intern unverändert
    `AuthGuardService.authenticate()` — die Kernlogik (Bearer-Extraktion,
    Ablauf-/Issuer-/Audience-Prüfung, Mapping `organizationId ->
    supplierId`) wurde NICHT neu geschrieben, nur per `@Injectable()`/
    `@Inject()` ans Modulsystem angeschlossen.
  - `TokenVerifier` hat jetzt eine echte Implementierung
    (`JoseTokenVerifier`) auf Basis von `jose` gegen einen
    `createRemoteJWKSet`-JWKS-Endpoint (`<issuer>/oauth/v2/keys`, wie in
    ADR 0004 skizziert). Issuer/Audience werden aus Umgebungsvariablen
    gelesen (`ZITADEL_ISSUER`/`ZITADEL_AUDIENCE`, siehe
    `apps/api/.env.example`) — fehlen sie, verweigert `apps/api` den Start
    mit einer klaren Fehlermeldung statt eines stillen Fallbacks.
  - `ContractsService`/`ContractRepository` unverändert in der Kernlogik
    (403-vs-404-Unterscheidung); eine `InMemoryContractRepository` macht das
    Modul lauffähig/testbar und ist im Code klar als **Übergangslösung ohne
    Datenbank-Entscheidung** markiert (keine DB/ORM-ADR vorhanden — wird
    hier nicht im Alleingang nachgeholt).
  - Jest + `ts-jest` eingerichtet. Drei Testdateien decken genau den in der
    Aufgabenstellung benannten QA/Security-Blocker ab:
    `contracts.service.spec.ts` (403 vs. 404 vs. 200, Mandantentrennung,
    synthetische Testdaten), `auth-guard.service.spec.ts` (Guard lehnt
    fehlendes/strukturell ungültiges/abgelaufenes Token sowie
    Issuer-/Audience-Mismatch und fehlenden Organization-Claim ab) und
    `test/contracts.e2e-spec.ts` (echter HTTP-Layer-Test via `supertest` +
    `Test.createTestingModule`, inkl. des Kern-Gates "Lieferant A ruft
    Kontrakt von Lieferant B ab → 403").
  - `FakeTokenVerifier` (`src/auth/testing/fake-token-verifier.ts`) ist das
    in ADR 0006 Punkt 3 geforderte Test-Double: signiert/verifiziert
    Test-Tokens mit einem im Testprozess erzeugten RSA-Schlüsselpaar, ohne
    Netzwerkzugriff und ohne jeden Bezug zur echten ZITADEL-Cloud-Instanz.
    Alle Auth-Tests (inkl. des HTTP-Layer-Tests) nutzen ausschließlich
    dieses Double via `overrideProvider(TOKEN_VERIFIER)`.
- **`apps/web` (React + Vite)**: `ContractsListPage.tsx` ist jetzt eine
  echte, renderbare React-Komponente (Kernlogik/Spalten/AC5/AC6/AC8-
  Darstellung unverändert übernommen); `App.tsx` rendert sie vorerst mit
  klar als Demo gekennzeichneten synthetischen Platzhalterdaten, da ein
  echter Fetch gegen `apps/api` einen laufenden OIDC-Login voraussetzt.
  `auth-client.ts`/`oidc-config.types.ts` bleiben wie in ADR 0004 vorgesehen
  bewusst TODO/Platzhalter (kein echtes OIDC-SDK). Jest + `ts-jest` +
  React Testing Library eingerichtet, mit einem Rendering-Test
  (`ContractsListPage.spec.tsx`: Leer-Zustand/AC5, Pflichtspalten/AC2,
  Abgelaufen-Kennzeichnung/AC8, Veraltet-Hinweis/AC6).
- **`apps/mobile` (Expo)**: minimale `App.tsx`-Shell, `auth-client.ts`/
  `oidc-config.types.ts` ebenfalls bewusst TODO/Platzhalter. Jest mit
  `jest-expo`-Preset eingerichtet, ein Rendering-Test (`App.spec.tsx`, mit
  `act()`-Wrapping wegen React 19s asynchronem Scheduler in
  `react-test-renderer`).
- **CI (ADR 0006)**: `.github/workflows/ci.yml` — eine Pipeline, Matrix-Job
  pro App (`lint`/`typecheck`/`test`) plus ein separater Build-Job für
  `apps/api`/`apps/web`. Kein Deployment/CD. Läuft nachweislich **ohne**
  ZITADEL-Cloud-Secrets, da alle Auth-Tests gegen `FakeTokenVerifier` laufen
  (ADR 0006 Punkt 3 eingehalten).

**Wo die Umsetzung von den ADRs abweicht bzw. Umsetzungsdetails ergänzt,
die keine ADR vorwegnehmen sollten, und warum:**

- **Vite als Build-Tool für `apps/web`.** Keine ADR trifft eine
  Web-Bundler-Entscheidung (ADR 0003/0007 entscheiden ausdrücklich nur
  Monorepo-Struktur bzw. Workspace-/Paketmanager-Tooling). Vite wurde als
  unstrittiges, leichtgewichtiges React+TypeScript-Standardsetup gewählt
  (Kommentar dazu in `apps/web/vite.config.ts`). Falls das rückblickend
  doch als architektonisch relevant genug für eine eigene ADR bewertet
  wird, sollte der Architect-Agent das nachholen — hier bewusst nur als
  dokumentiertes Umsetzungsdetail behandelt, keine stillschweigende
  Festlegung.
- **`jose` in Version 5.x statt 6.x.** `jose@6` ist ESM-only (kein
  `require`-Export mehr), was mit dem NestJS-Standard-Build (CommonJS)
  sowohl zur Laufzeit als auch mit `ts-jest` kollidiert
  (`ERR_REQUIRE_ESM`/`SyntaxError: Unexpected token 'export'`). `jose@5`
  bietet weiterhin einen CJS-Exportpfad (Dual-Package) und wurde deshalb
  gewählt — reine Kompatibilitätsentscheidung, keine Architekturfrage.
- **Jest-Versionsdivergenz zwischen `apps/mobile` (29.7.0 + `jest-expo`
  ~57.0.3) und `apps/api`/`apps/web` (30.x).** Expo SDK 57s `jest-expo`-
  Preset ist intern noch an Jest-29-Pakete gebunden. ADR 0005 schreibt
  "Jest einheitlich" als **Test-Framework/-API** über alle drei Apps fest,
  nicht zwingend eine identische Minor-/Major-Version — diese Divergenz
  wird hier explizit dokumentiert statt stillschweigend in Kauf genommen,
  da sie sonst wie eine versehentliche Inkonsistenz wirken könnte.
- **`apps/api/package.json` listet `jest-environment-node` explizit als
  `devDependency`**, obwohl das eigentlich eine implizite Default-Abhängigkeit
  von Jest ist. Grund: Ohne diese explizite Angabe hoistete npm wegen der
  oben genannten Jest-Versionsdivergenz eine mit `apps/mobile` kompatible,
  aber zu `apps/api`s Jest 30 inkompatible `jest-environment-node@29`-Kopie
  in den Root-`node_modules`, was `apps/api`s Tests mit
  `this._moduleMocker.clearMocksOnScope is not a function` zum Absturz
  brachte (Node löst Jests implizite `testEnvironment`-Abhängigkeit
  projekt-relativ auf, nicht relativ zum installierten `jest`-Paket selbst).
  Analog zum bereits vorhandenen Muster `jest-environment-jsdom` in
  `apps/web` behoben — ein reines npm-Workspaces-Hoisting-Detail, keine
  Architekturentscheidung.
- **`ContractRepository` bleibt In-Memory (Übergangslösung).** Keine
  Datenbank-/ORM-Wahl wurde getroffen (nicht Teil der referenzierten ADRs);
  das Repository ist im Code klar als Platzhalter markiert und muss ersetzt
  werden, sobald eine Persistenz-ADR vorliegt.
- **Kein echter OIDC-Login-Flow.** `auth-client.ts`/`oidc-config.types.ts`
  bleiben in `apps/web` **und** `apps/mobile` bewusst `declare
  function`-Platzhalter, wie in ADR 0004 vorgesehen ("konkrete
  Bibliothekswahl ... wird NICHT in dieser ADR getroffen"). AC7 (Redirect
  zur Anmeldeseite) ist dadurch weiterhin nicht umgesetzt.
- **Relativer Cross-App-Type-Import** (`apps/web/src/contracts/
  ContractsListPage.tsx` importiert `import type { ... } from
  '../../../api/src/contracts/contract.types'`) bleibt unverändert
  bestehen, da ADR 0003 ein geteiltes Contract-Package explizit als
  **künftige**, noch nicht umgesetzte Konsequenz nennt. Da es sich um einen
  reinen `import type`-Import handelt, wird zur Laufzeit nichts aus
  `apps/api` gebündelt (TypeScript/Vite/ts-jest entfernen ihn beim
  Kompilieren vollständig) — funktional unkritisch, aber ein struktureller
  Wermutstropfen, der bei einer künftigen Paket-Extraktion aufgelöst werden
  sollte.
- **Kein Ingestion-Adapter Lobster → apps/api**, **keine echte ZITADEL-
  Projektkonfiguration für `apps/mobile`** und **kein EAS-/App-Store-Build**
  für `apps/mobile` — alle drei bleiben wie in den referenzierten ADRs
  bereits als offen markiert, nicht Teil dieses Bootstrap-Auftrags.
- **Keine echten/plausibel-echten Lieferantendaten.** Alle Fixtures/Seed-
  Daten (`InMemoryContractRepository`, Test-Suiten, `App.tsx`-Demo-Daten)
  verwenden ausschließlich offensichtlich synthetische Platzhalterwerte
  (z. B. `SYNTH-KONTRAKT-...`, `supplier-synthetic-a/-b`).

