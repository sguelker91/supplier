# DevOps-Notiz: Lieferant kann seine Kontrakte in der Extranet-Weboberfläche einsehen

> **Hinweis zum Reifegrad:** Für dieses Repository existiert aktuell
> **kein CI vorhanden — Vorschlag**. Es gibt weder `package.json` noch
> ein lauffähiges NestJS-/React-/Expo-Projekt unter `apps/*`, keine
> CI-Workflow-Dateien und keine bestehende Umgebungsinfrastruktur
> (Dev/Staging/Prod). Alles Folgende ist daher eine **Empfehlung für
> den Zeitpunkt, ab dem reale Implementierung beginnt**, nicht die
> Beschreibung eines bestehenden Zustands. Es werden in dieser Phase
> keine echten CI-Workflow-Dateien angelegt.
>
> Zusätzlich gilt: Laut Security-Bericht
> (`docs/security/lieferant-kontrakte-einsehen.md`) ist die Story
> aktuell **"Blockiert"** — insbesondere wegen fehlendem
> Auth-/Session-Mechanismus (AC7), fehlender durchsetzender
> Mandantentrennung (AC4, Guard/Controller fehlen) und fehlendem
> Rate-Limiting/Enumerationsschutz gegen das 403-vs-404-Informationsleck.
> Diese DevOps-Notiz plant die Pipeline/Umgebungen/Secrets *unter der
> Annahme*, dass diese Blocker vor einem produktiven Rollout behoben
> werden — sie ersetzt keine der dort geforderten Maßnahmen.

## Pipeline-Änderungen

**Kein CI vorhanden — Vorschlag.** Sobald Monorepo-Tooling (laut
`docs/architecture/overview.md` noch offen) und ein Test-Framework
feststehen, sollte die CI-Pipeline für diese Story mindestens folgende
Stufen enthalten:

1. **Lint & Type-Check** (`apps/api`, `apps/web`) — TypeScript
   `tsc --noEmit`, ESLint. Muss insbesondere sicherstellen, dass
   `AuthenticatedSupplierContext`/`supplierId`-Handling nicht versehentlich
   aus Client-Eingaben (Header/Body/Query) befüllt wird (siehe
   Security-Befund "reines Vertrauenskonstrukt ohne Herkunftsgarantie").
2. **Unit-Tests `apps/api`** — insbesondere `ContractsService`:
   - 403/404/200-Fallunterscheidung (`getMyContractById`)
   - `findManyForSupplier` ist immer supplier-gefiltert
   - `isStale`/`lastSuccessfulSyncAt`-Berechnung (AC6)
   - `status`-Ableitung (aktiv/abgelaufen, AC8)
3. **Integrations-/E2E-Test gegen echten HTTP-Layer, sobald Controller +
   Guard existieren** — explizit der von Security geforderte Test:
   "Lieferant A ruft Kontrakt von Lieferant B ab → 403, keine Daten im
   Response-Body". Dieser Test ist **Freigabevoraussetzung**, nicht
   optional, und sollte als Pipeline-Gate (Pflicht-Check vor Merge in
   den Hauptzweig) konfiguriert werden.
4. **Security-/Dependency-Scan** — SAST/Dependency-Audit (z. B.
   `npm audit`/Snyk-äquivalent), sobald `package.json` existiert;
   Secret-Scanning (z. B. Gitleaks) im Pre-Commit/CI, um versehentliches
   Einchecken von ERP-/Lobster-Zugangsdaten frühzeitig zu erkennen.
5. **Rate-Limiting-Konfigurationstest** — sobald Rate-Limiting-Middleware
   für `/contracts*` existiert (Security-Vorgabe gegen
   403/404-Enumeration), Test, der eine Drosselung nach N Requests
   nachweist.
6. **Build** — `apps/api` (NestJS-Build), `apps/web` (Vite/CRA-Build,
   je nach künftiger Framework-Entscheidung).
7. **Contract-/Schema-Test für den Ingestion-Adapter** (sobald das
   Lobster-Transportmuster geklärt ist, siehe ADR 0001 Punkt 4): Test,
   der sicherstellt, dass nur Felder gemäß der noch zu definierenden
   Allowlist (siehe Security-Befund "Datenminimierung") in
   `Contract`/`ContractCondition` geschrieben werden — kein
   Passthrough unbekannter ERP-Felder.

Alle diese Schritte sind Vorschläge; keiner ist heute als
Workflow-Datei (z. B. GitHub Actions) im Repository vorhanden.

## Umgebungen / Konfiguration

**Kein CI/CD vorhanden — Vorschlag** für eine dreistufige
Umgebungsstrategie:

| Umgebung | Zweck | ERP/Lobster-Anbindung | Auth |
|---|---|---|---|
| **Dev** | Lokale Entwicklung / Feature-Branches | Gemockter/simulierter Ingestion-Adapter (synthetische `IncomingContractRecord`-Fixtures, keine echten ERP-Daten) | Test-Login mit synthetischen Lieferanten-Accounts |
| **Staging** | Vorab-Abnahme, QA/Security-Prüfung vor Rollout | Anbindung an ERP-/Lobster-**Test-/Sandbox-Instanz**, falls vom ERP-Team bereitgestellt; sonst weiterhin Mock mit realistischerem Datenvolumen (für Enumerations-/Last-Tests) | Gleicher Auth-Mechanismus wie Prod, aber mit Test-Accounts |
| **Prod** | Echtbetrieb für Lieferanten | Echte ERP-/Lobster-Anbindung | Produktiver Auth-Mechanismus (Details noch offen, siehe ADR 0002 Punkt "offene Annahme") |

Wichtige Punkte, sobald reale Infrastruktur entsteht:
- Konfiguration pro Umgebung ausschließlich über Umgebungsvariablen /
  Konfigurationsdateien außerhalb des Repos (kein Hardcoding von
  ERP-/Lobster-Endpunkten oder -Zugangsdaten im Code).
- `apps/web` darf in keiner Umgebung direkt gegen ERP/Lobster sprechen
  (ADR 0001 Punkt 1) — die Umgebungstrennung betrifft ausschließlich
  `apps/api` und dessen Ingestion-Adapter.
- Staging sollte, sobald das Rate-Limiting/Enumerationsschutz aus dem
  Security-Bericht implementiert ist, auch als Ort für gezielte
  Penetrationstests des 403-vs-404-Verhaltens dienen, bevor Prod
  freigegeben wird.

## Secrets-Handling

**Kein CI/Secrets-Infrastruktur vorhanden — Vorschlag.** Für die
künftigen ERP-/Lobster-Zugangsdaten des Ingestion-Adapters (Punkt 4 aus
ADR 0001) gilt als Ansatz, sobald die Implementierung beginnt:

- **Nie im Klartext im Repository, in CI-Logs oder in Dokumentation.**
  Diese Notiz nennt bewusst keine konkreten Variablennamen/Werte für
  Zugangsdaten, sondern nur den Handling-Ansatz.
- **Zentraler Secret-Manager statt Repo-/CI-Variablen im Klartext.**
  Empfehlung: ein dedizierter Secret-Store (z. B. Cloud-Provider-eigener
  Secret Manager oder Vault-äquivalent), aus dem `apps/api` die
  ERP-/Lobster-Zugangsdaten zur Laufzeit lädt (z. B. per Umgebungsvariable,
  die von der Deployment-Plattform aus dem Secret-Manager injiziert
  wird — nicht als Klartext-Variable im CI-Konfigurationsfile).
- **Least Privilege pro Umgebung.** Getrennte Credentials für
  Dev/Staging/Prod, jeweils mit minimalen Berechtigungen (z. B.
  ausschließlich Lesezugriff auf die für Kontrakte relevanten
  Lobster-/ERP-Schnittstellen, kein Schreibzugriff, falls die
  Schnittstelle das unterscheidet).
- **Rotation.** Regelmäßige Rotation der ERP-/Lobster-Zugangsdaten
  gemäß den Vorgaben des ERP-/Integrationsverantwortlichen; Rotation
  darf keinen Deployment-Eingriff im Code erfordern (Secrets werden
  referenziert, nicht gebacken).
- **Secret-Scanning in CI** (siehe Pipeline-Abschnitt), um versehentliches
  Einchecken von Zugangsdaten zu erkennen, bevor sie in die
  Versionshistorie gelangen.
- **Kein Logging von Secrets oder sensiblen Payloads.** Deckt sich mit
  dem Security-Befund zu fehlender Fehlerbehandlungsstrategie: striktes
  Verbot, ERP-/Lobster-Antwortpayloads (die ggf. Zugangsdaten oder
  Preis-/Mengenkonditionen enthalten) unstrukturiert in
  Anwendungs- oder CI-Logs zu schreiben.
- **Audit der Secret-Zugriffe**, sofern der gewählte Secret-Manager das
  unterstützt, ergänzend zum vom Security-Bericht geforderten
  Zugriffs-Audit-Log auf Anwendungsebene für `/contracts*`.

## Mobile-Release-Aspekte

**Nicht relevant für diese Story.** Laut Backlog-Nicht-Ziel ("Keine
mobile App-Umsetzung — Scope ist ausschließlich die Web-Oberfläche des
Extranets") entfallen Expo-EAS-Build/-Submit sowie App-Store-/
Play-Store-Aspekte für dieses Feature vollständig. Keine Maßnahmen
vorgesehen.

## Rollout-Plan

**Kein CI/CD vorhanden — Vorschlag.** Rollout dieser Story ist an
harte Vorbedingungen aus dem Security-Bericht geknüpft; ein
"normaler" schrittweiser Feature-Rollout ist erst nach Behebung der
kritischen Blocker sinnvoll:

1. **Vorbedingung (Blocker, muss vor jedem Prod-Rollout erfüllt sein):**
   - Lauffähiger Controller + Auth-Guard mit verifizierter,
     nicht client-manipulierbarer `supplierId` (AC4).
   - Funktionierender Session-/Auth-Mechanismus (AC7).
   - Explizite Security-/Product-Entscheidung zum 403/404-Trade-off
     inkl. opaker Kontrakt-IDs (UUID statt fortlaufender Nummer) und
     Rate-Limiting.
   - Dokumentierte Feld-Allowlist für `conditions[]` an der
     Lobster-/ERP-Grenze sowie DSGVO-Klärung (Rechtsgrundlage,
     Aufbewahrung).
   - Ohne diese Punkte: **kein Prod-Deployment dieses Features**,
     unabhängig davon, ob eine CI/CD-Pipeline technisch bereitsteht.
2. **Staging-Rollout** nach Erfüllung der Vorbedingungen: Deployment
   gegen ERP-/Lobster-Sandbox oder realistischen Mock, gefolgt von
   erneuter Security-/QA-Prüfung speziell des Mandantentrennungs- und
   Enumerationsverhaltens (End-to-End-Test "Lieferant A → Kontrakt von
   Lieferant B → 403, kein Daten-Leak im Body").
3. **Produktiver Rollout** schrittweise vorschlagen, sobald Staging
   grün ist:
   - Feature-Flag oder Rollout auf eine kleine Kohorte von
     Lieferanten-Accounts zuerst (falls Feature-Flag-Infrastruktur
     existiert), um reale ERP-/Lobster-Datenqualität und
     Sync-Status-Anzeige (AC6) zu beobachten, bevor alle Lieferanten
     Zugriff erhalten.
   - Erst nach unauffälliger Beobachtungsphase (Fehlerquote,
     403-Antwortrate als Enumerations-Indikator, Sync-Erfolgsquote)
     vollständige Freischaltung.
4. **Rollback-Plan:**
   - Da `apps/web` laut ADR 0001 ausschließlich über `apps/api` liest
     und keine direkte ERP-/Lobster-Abhängigkeit hat, ist ein Rollback
     primär ein Zurückrollen des `apps/api`-Deployments (Controller/
     Guard/Service) sowie des zugehörigen `apps/web`-Menüpunkts/Routings
     auf die vorherige Version.
   - Bei Verdacht auf einen Mandantentrennungsvorfall (fremde
     Kontraktdaten sichtbar): sofortiges Deaktivieren des
     `/contracts*`-Zugriffs (z. B. über Feature-Flag oder
     Notfall-Deployment) noch vor einem vollständigen Rollback, um
     weitere Datenexposition zu verhindern; anschließend Auswertung
     über das (laut Security-Bericht einzuführende) Zugriffs-Audit-Log.
   - Der Ingestion-Adapter (Lobster → `apps/api`) sollte unabhängig
     vom Web-/API-Feature zurückrollbar sein, damit ein Datenfehler an
     der ERP-Grenze nicht zwingend einen Rollback der gesamten Story
     erfordert (Entkopplung gemäß ADR 0001).
   - Kein Rollback-Mechanismus ist aktuell implementiert oder
     getestet — dies ist ebenfalls ein Vorschlag, der bei
     Infrastruktur-Aufbau konkretisiert werden muss (z. B. Blue/Green-
     oder Canary-Deployment für `apps/api`).

## Monitoring / Alerting

**Kein Monitoring vorhanden — Vorschlag.** Sobald Infrastruktur
existiert, mindestens folgende Signale beobachten:

- **Sicherheitsrelevant:**
  - Rate/Anzahl 403-Antworten auf `GET /contracts/:contractId` pro
    Zeitfenster und pro Account — als Frühindikator für
    Enumerationsversuche (deckt sich mit dem Security-Befund zum
    403/404-Trade-off).
  - Fehlgeschlagene Login-/Session-Verifikationen (AC7) — Anomalien
    können auf Credential-Stuffing hindeuten.
  - Zugriffs-Audit-Log-Auswertung (sobald implementiert): unerwartete
    Zugriffsmuster (z. B. ein Account, der viele unterschiedliche
    `contractId`-Werte in kurzer Zeit abruft).
- **Fachlich/Betrieblich:**
  - `ContractSyncRun`-Status (success/failed/partial) und Alerting bei
    fehlgeschlagenen oder ausbleibenden Sync-Läufen, damit
    `isStale`/`lastSuccessfulSyncAt` (AC6) nicht unbemerkt dauerhaft
    veraltet bleibt.
  - Fehlerquote der `/contracts*`-Endpunkte (5xx) getrennt von
    erwarteten 403/404-Antworten.
  - Ingestion-Adapter: Alerting bei ERP-/Lobster-Verbindungsfehlern
    oder Authentifizierungsfehlern gegen die ERP-/Lobster-Schnittstelle
    (ohne die Zugangsdaten selbst zu loggen).
- **Explizit kein Logging sensibler Inhalte:** Keine
  Preis-/Mengenkonditionen, keine vollständigen ERP-Antwort-Payloads
  und keine Zugangsdaten in Logs oder Monitoring-Dashboards — nur
  Metadaten (Status, Zeitstempel, IDs, Zähler).
