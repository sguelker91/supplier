# DevOps-Notiz: Lieferberechtigungen anzeigen

> **Hinweis zum Reifegrad:** Wie bereits für `lieferanten-anmeldung-gpa`
> dokumentiert, besteht eine echte CI-Pipeline
> (`.github/workflows/ci.yml`, GitHub Actions gemäß ADR 0006:
> Lint/Typecheck/Test für `apps/api`/`apps/web`/`apps/mobile`, Build für
> `apps/api`/`apps/web`). **CI besteht bereits.** Weiterhin **nicht**
> vorhanden — hier wieder als **"kein CD vorhanden — Vorschlag"** markiert:
> jegliche Deployment-/CD-Pipeline, echte betriebene Umgebungen
> (Dev/Staging/Prod), GitHub-Environments/-Secrets-Konfiguration und
> Monitoring-/Log-Aggregations-Infrastruktur. Diese Story ändert daran
> nichts.
>
> Security (`docs/security/lieferberechtigungen-anzeigen.md`) hat das
> Feature für den heutigen Scope (In-Memory-/Stub-Übergangslösung, keine
> reale D3-Cloud-/ERP-Anbindung) **freigegeben** — kein Blocker wie bei
> `lieferanten-anmeldung-gpa`. Es bestehen aber mehrere, im Security-Bericht
> als "nicht blockierend, aber vor Produktivbetrieb mit echten
> Lieferantendaten zu adressieren" markierte Punkte. Diese Notiz plant die
> operative Rollout-/Betriebs-Perspektive dafür — sie löst keinen der
> Security-/Architektur-Befunde selbst (nicht Aufgabe dieser Rolle).

## Pipeline-Änderungen

**Bestehender Zustand ist ausreichend — keine Änderung an `ci.yml`
nötig.** Geprüft anhand von `apps/api/package.json`/`apps/web/package.json`:
Beide Workspaces nutzen `"test": "jest"` bzw. `"lint"/"typecheck": "tsc
--noEmit"` ohne manuell gepflegte Datei-/Verzeichnislisten. Das bedeutet:

- Das neue Backend-Modul `apps/api/src/delivery-authorizations/` sowie
  `apps/api/src/documents/` (inkl. `*.spec.ts` und
  `apps/api/test/delivery-authorizations.e2e-spec.ts`,
  `apps/api/test/documents.e2e-spec.ts`) werden von
  `npm run test --workspace=apps/api` automatisch discovert — Jest sucht
  projektweit nach Test-Dateimustern, kein Glob-Update in `ci.yml` oder
  `apps/api/package.json` erforderlich.
- Das neue Design-System (`apps/web/src/design-system/*`) und das neue
  Frontend-Modul (`apps/web/src/delivery-authorizations/*`) werden ebenso
  automatisch von `npm run test --workspace=apps/web` erfasst.
- `tsc --noEmit -p tsconfig.json` (sowohl `lint` als auch `typecheck` in
  beiden Workspaces) prüft den gesamten Workspace-Quellbaum, keine
  explizite Include-Liste, die um die neuen Verzeichnisse ergänzt werden
  müsste.
- **Keine neuen CI-Secrets/Umgebungsvariablen nötig.** ADR 0006 Punkt 3
  gilt unverändert: `apps/api`-E2E-Tests laufen ausschließlich gegen
  `FakeTokenVerifier`, kein Netzwerkzugriff auf ZITADEL oder eine reale
  D3-Cloud-/Lobster-Schnittstelle. Der `StubDocumentProvider` liefert
  synchron eine leere Liste — es gibt keine externe Abhängigkeit, die in
  CI erreichbar sein müsste.
- **`apps/web build`** (`tsc --noEmit && vite build`) kompiliert das neue
  `react-router-dom`-Routing und die CSS-Module des Design-Systems bereits
  über den bestehenden `build`-Job der Matrix (`apps/api`, `apps/web`) mit —
  keine neue Toolchain (kein zusätzlicher Bundler/Preprocessor) eingeführt,
  die eine eigene CI-Stufe bräuchte.

**Fazit: `.github/workflows/ci.yml` deckt die vier genannten neuen Module
bereits vollständig ab, ohne Anpassung.** Das habe ich anhand der
Workspace-Skripte verifiziert, nicht nur angenommen.

**Vorschlag für eine künftige Iteration** (nicht jetzt umsetzen): Sobald ein
echter Ingestion-Adapter für `IncomingDeliveryAuthorizationRecord` bzw. ein
`D3CloudDocumentProvider` gebaut wird, sollte geprüft werden, ob deren Tests
weiterhin ohne echte Netzwerk-/Lobster-/D3-Cloud-Anbindung in CI laufen
(Test-Doubles analog `FakeTokenVerifier`) — sonst entstünde ein neuer Bedarf
an Secrets/Mocking-Infrastruktur in `ci.yml`, der heute noch nicht besteht.

## Umgebungen / Konfiguration

**Kein CD/Umgebungsinfrastruktur vorhanden — Vorschlag,** unverändert zum
bereits in `docs/devops/lieferanten-anmeldung-gpa.md` dokumentierten Stand.
Diese Story fügt jedoch einen konkreten, story-eigenen Konfigurationspunkt
hinzu: die hart codierte `API_BASE_URL`.

### `API_BASE_URL` — Voraussetzung für einen echten Rollout

Der Security-Bericht bemängelt (niedrig, "geerbte, nicht story-spezifische
Lücke", aber jetzt auch für Lieferberechtigungen/Dokumente wirksam):
`apps/web/src/api-client/api-config.ts` exportiert `API_BASE_URL =
'http://localhost:3000'` als Klartext-Konstante, ohne Env-Konzept. Aus
DevOps-Sicht ist das für lokale Entwicklung unkritisch (kein Geheimnis,
funktioniert nur lokal), aber eine **harte Blockade für jeden Vercel-
Rollout** — in Staging/Prod gäbe es kein `localhost:3000` zu erreichen.

Vorschlag (Skizze, keine Code-Änderung durch diese Rolle):

- `apps/web` nutzt Vite als Build-Tool (`apps/web/vercel.json`:
  `"framework": "vite"`). Vite liest zur Build-Zeit `import.meta.env.VITE_*`
  aus Umgebungsvariablen. Die naheliegende Lösung: `API_BASE_URL` aus einer
  Build-Zeit-Env-Var `VITE_API_BASE_URL` ableiten (mit dem heutigen
  `http://localhost:3000`-Wert nur noch als lokaler Default/Fallback), statt
  eines fest kodierten Strings.
- **Pro Vercel-Environment gesetzt**, analog zum in
  `docs/devops/lieferanten-anmeldung-gpa.md` etablierten Muster für
  ZITADEL-Konfigurationswerte (öffentliche, nicht-geheime
  Konfiguration → Vercel "Environment Variables", nicht "Secrets" im
  engeren Sinn, da eine API-Basis-URL kein Geheimnis ist):

  | Vercel-Environment | `VITE_API_BASE_URL` (Beispiel) |
  |---|---|
  | Development (lokal, `.env.local`, nicht eingecheckt) | `http://localhost:3000` |
  | Preview (Vercel Preview-Deployments je PR) | HTTPS-Endpunkt der Staging-`apps/api`-Instanz |
  | Production | HTTPS-Endpunkt der Produktions-`apps/api`-Instanz |

- **HTTPS ist hier die eigentliche Anforderung**, nicht nur "keine
  hartcodierte URL": Sobald echte Lieferantendaten (Lieferberechtigungen,
  perspektivisch Dokumente) über die Leitung gehen, ist ein
  Klartext-`http://`-Endpunkt in Staging/Prod nicht akzeptabel — das betrifft
  auch das dazugehörige `apps/api`-Deployment selbst (TLS-Terminierung),
  nicht nur den Frontend-Konfigurationswert.
- Diese Umstellung ist eine **Rollout-Voraussetzung**, die vor einem
  Vercel-Deployment mit echtem Backend erledigt sein muss — sie wird hier
  bewusst nur als Anforderung dokumentiert, nicht als Code-Änderung
  vorgenommen (das ist Aufgabe des Developer-Agenten in einer
  Folge-Iteration).

Bestehende Umgebungsstaffelung, unverändert übernommen (kein neuer
technischer Zustand durch diese Story):

| Umgebung | Zweck | Voraussetzung für dieses Feature |
|---|---|---|
| **Dev** | Lokale Entwicklung | Bereits nutzbar: In-Memory-Repository, `StubDocumentProvider`, `API_BASE_URL` per lokalem Fallback. |
| **Staging** | QA-/Security-Abnahme vor Rollout | `VITE_API_BASE_URL` auf HTTPS-Staging-`apps/api` gesetzt; echte Persistenz **nicht** zwingend Voraussetzung für Staging (In-Memory reicht für eine reine Funktionsabnahme), aber Rollout-Gate unten für Prod. |
| **Prod** | Echtbetrieb mit echten Lieferantendaten | **Explizit blockiert**, siehe Rollout-Gate unten. |

## Secrets-Handling

**Kein neues ERP-/Lobster-Zugangsdaten-Secret durch diese Story.** Wie im
ADR 0009 ("Offene Annahmen") festgehalten, ist der konkrete
Transportmechanismus Lobster → `apps/api` für Lieferberechtigungen weiterhin
unbekannt und nicht Gegenstand dieser Story — es existiert noch kein
Ingestion-Adapter, der reale Zugangsdaten benötigen würde. Ebenso liefert
der `StubDocumentProvider` aktuell ausschließlich eine leere Liste, ohne
reale D3-Cloud-Authentifizierung.

Für den Fall, dass künftig ein echter Ingestion-Adapter bzw. ein
`D3CloudDocumentProvider` entsteht, gilt derselbe Ansatz wie bereits für
ERP/Lobster in `docs/devops/lieferant-kontrakte-einsehen.md` dokumentiert
und in `docs/devops/lieferanten-anmeldung-gpa.md` fortgeschrieben — hier nur
kurz referenziert, nicht neu erfunden:

- ERP-/Lobster-Zugangsdaten (künftiger Lieferberechtigungs-Adapter) sowie
  ein künftiges D3-Cloud-API-Credential ausschließlich über einen
  Secret-Manager bzw. **GitHub Environment Secrets** (nicht
  Repository-Secrets), getrennt pro Umgebung (`development`/`staging`/
  `production`) — niemals als Klartext in Code, `.env`-Dateien im Repo,
  Workflow-YAML, Logs oder Dokumentation.
- Referenzierung ausschließlich über `${{ secrets.<NAME> }}` in einem
  künftigen Deployment-/Ingestion-Workflow, nie in `echo`/Debug-Ausgaben.
- Least Privilege pro Umgebung, Rotation ohne Code-Deployment.
- `VITE_API_BASE_URL` selbst ist **kein Secret** (öffentliche
  Konfiguration, keine geheime Information) — sie gehört als normale
  Vercel-Environment-Variable geführt, nicht in den Secret-Manager, aber
  dennoch pro Umgebung getrennt konfiguriert (kein Hardcoding, kein
  gemeinsamer Wert für Staging/Prod).

## Rollout-Plan

### Rollout-Gate für Produktivbetrieb mit echten Lieferantendaten

Analog zum in `docs/devops/lieferanten-anmeldung-gpa.md` etablierten Muster
eines dokumentierten Freigabe-Gates leitet DevOps aus dem Security-Bericht
folgende, vor einem Prod-Rollout mit echten Lieferantendaten zwingend zu
erfüllende Punkte ab. DevOps entscheidet dabei **nicht** selbst über die
fachliche/technische Lösung — das bleibt Aufgabe von Security/Architect/
Product/Developer —, sondern verlangt einen dokumentierten Nachweis als
Deployment-Voraussetzung:

1. **Entscheidung zum 403-vs-404-Enumerationsrisiko** (Security-Befund
   "hoch", jetzt auf zwei Endpunkte verdoppelt:
   `/delivery-authorizations/:id` und `/documents`). Muss domänenübergreifend
   (Kontrakte + Lieferberechtigungen + künftige Abnahmescheine) einmalig
   entschieden werden — entweder opake IDs (UUIDv4 o. ä.) für
   `DeliveryAuthorization.id`/`DocumentReference.id` plus Rate-Limiting, oder
   ein einheitliches 404 für "nicht gefunden ODER fremd" (Folge-ADR). Kein
   Prod-Rollout, solange dieser seit der Kontrakte-Domäne wiederholt
   aufgeschobene Trade-off weiterhin unentschieden bleibt.
2. **`supplierGpa`-Annahme verifiziert.** Vor Implementierung des
   Lieferberechtigungs-Ingestion-Adapters muss der Lobster-/SAP-
   Integrationsverantwortliche bestätigt haben, dass der Export für
   Lieferberechtigungen tatsächlich die GPA liefert (nicht eine gesonderte
   ältere ERP-Kennung) — als hartes Gate vor dem ersten Adapter-Commit, nicht
   erst bei einem Produktionsvorfall. Empfehlung: in derselben Session wie
   die für Kontrakte bereits geforderte Mapping-Verifikation klären (gleicher
   Ansprechpartner).
3. **`API_BASE_URL` auf echte HTTPS-Konfiguration umgestellt** (siehe
   Umgebungen-Abschnitt): `VITE_API_BASE_URL` pro Vercel-Environment
   gesetzt, `apps/api`-Deployment mit TLS-Terminierung — kein
   Klartext-`http://localhost`-Endpunkt mehr im Produktionspfad.
4. **In-Memory-Repository durch echte Persistenz ersetzt**
   (`InMemoryDeliveryAuthorizationRepository` → echte DB-/ORM-Anbindung).
   Solange keine echte Persistenz existiert, ist ein Prod-Rollout mit
   echten Lieferantendaten schon aus Verfügbarkeitssicht (Datenverlust bei
   jedem Neustart) nicht sinnvoll — unabhängig von den Security-Befunden.
5. Zusätzlich, als **nicht-blockierende, aber vor Produktivbetrieb zu
   klärende** Begleitpunkte aus dem Security-/QA-Bericht (nachrichtlich, da
   nicht ausdrücklich in der Aufgabenstellung als Mindest-Gate genannt, aber
   Teil derselben Freigabe-Auflage):
   - Exhaustiveness-Absicherung im `DocumentsController` (mittel) ist laut
     Security-Bericht bereits im Code umgesetzt ("bereits gehärteter
     Exhaustiveness-Check") — als **erledigt** zu bestätigen, nicht erneut
     zu fordern; DevOps vermerkt dies hier nur zur Vollständigkeit des
     Gate-Status.
   - Sichtbarer, nicht-blockierender Fehlerhinweis bei fehlgeschlagenem
     Dokumenten-Laden (QA-Befund 1) vor einer echten D3-Cloud-Anbindung.
   - Audit-Logging-Konzept für Lesezugriffe sowie dokumentierte
     Rechtsgrundlage/ROPA-Eintrag (Security-/QA-Befund, domänenübergreifend
     offen).

Empfehlung: Diese Punkte als **manuelles Freigabe-Gate** (z. B. ein GitHub
Environment "production" mit Required Reviewers) am künftigen
Deployment-Workflow abbilden, sobald dieser existiert — die meisten Punkte
(2, teilweise 5) sind organisatorisch/fachlich, nicht automatisiert
CI-prüfbar; Punkt 3 und 4 sind technisch verifizierbar (z. B. ein
Deployment-Check, der bei erkanntem `localhost`-Wert in
`VITE_API_BASE_URL` fehlschlägt, ist ein sinnvoller künftiger, aber heute
noch nicht existierender CI-Baustein).

### Gestaffelter Rollout, sobald CD existiert

Da diese Story reine Leseoperationen (keine Schreib-/Uploadpfade) betrifft
und Security keine kritischen Befunde gefunden hat, ist das Risikoprofil
deutlich geringer als bei `lieferanten-anmeldung-gpa` (dort: Auth-Pfad,
potenziell alle Lieferanten gleichzeitig betroffen). Dennoch, sobald eine
CD-Pipeline existiert:

1. Staging-Deployment nach Erfüllung von Gate-Punkt 3 (HTTPS-Konfiguration)
   — Persistenz und Adapter-Verifikation (Gate-Punkte 2/4) sind für eine
   reine Staging-Funktionsabnahme mit synthetischen Testdaten nicht
   zwingend, wohl aber für den anschließenden Produktiv-Rollout.
2. QA-/Security-Abnahme in Staging: insbesondere Verifikation, dass die
   Mandantentrennung (`/delivery-authorizations/:id`, `/documents`) auch
   gegen ein reales HTTPS-Deployment (nicht nur den lokalen Jest-Testlauf)
   funktioniert.
3. Produktiver Rollout erst nach vollständiger Erfüllung aller vier
   Gate-Punkte oben — kein "big bang" zwingend erforderlich (kein
   IdP-Wechsel wie bei der Anmeldungs-Story), aber ein schrittweiser
   Kohorten-Rollout (z. B. zunächst eine kleine Gruppe von GPA-
   Organisationen) ist sinnvoll, um eine falsche `supplierGpa`-Annahme
   (Gate-Punkt 2) früh anhand echter Daten zu erkennen, bevor die volle
   Lieferantenbasis betroffen ist.
4. **Rollback:** Da keine schreibenden Operationen und keine
   Zustandsänderungen beim Lieferanten stattfinden (reine Leseansicht),
   ist ein Rollback unkritischer als bei der Anmeldungs-Story — ein
   vorheriges Deployment von `apps/api`/`apps/web` kann ohne
   Datenmigrationsrisiko erneut ausgerollt werden, solange die
   In-Memory-Übergangslösung besteht. **Sobald echte Persistenz existiert
   (Gate-Punkt 4), gilt das nicht mehr uneingeschränkt** — dann ist vor
   jedem Rollback zu prüfen, ob ein Schema-/Datenmodell-Wechsel zwischen
   den Versionen ein reines Code-Rollback verhindert (Standard-DB-
   Migrations-Vorsicht, keine story-spezifische Besonderheit).
5. Bei Verdacht auf ein tatsächlich falsches `supplierGpa`-Mapping in
   Produktion (Gate-Punkt 2 nachträglich als falsch erkannt): sofortiges
   Deaktivieren des betroffenen Ingestion-Adapters hat Vorrand vor einem
   Code-Rollback der API/des Frontends, da der Fehler an der
   Lobster-Systemgrenze liegt, nicht im hier ausgelieferten Code.

## Monitoring / Alerting

**Kein Monitoring/Log-Aggregation vorhanden — Vorschlag für eine künftige
Iteration**, nicht heutige Implementierungsaufgabe (unverändert zum bereits
für `lieferanten-anmeldung-gpa` dokumentierten Stand). Für die neue Domäne
(`delivery-authorizations`, `documents`) wären folgende Metriken/Logs
sinnvoll, sobald eine Log-/Metrik-Infrastruktur existiert:

- **403-Rate auf `GET /delivery-authorizations/:id` und `GET /documents`**
  als Frühindikator für Enumerationsversuche (deckt sich mit dem Security-
  Befund "hoch"): ein plötzlicher Anstieg gezielter 403-Antworten (viele
  unterschiedliche `id`/`subjectId`-Werte von derselben Quelle) deutet auf
  systematisches ID-Probing hin, unabhängig davon, ob die
  403-vs-404-Grundsatzentscheidung (Gate-Punkt 1) noch aussteht oder bereits
  getroffen wurde.
- **404-Rate im Verhältnis zur 403-Rate** auf denselben Endpunkten — eine
  auffällige Verschiebung könnte zusätzlich helfen, das
  Enumerationsrisiko empirisch einzuschätzen (welcher Anteil der Anfragen
  trifft "existiert nicht" vs. "existiert, fremd").
- **Fehlerrate/Antwortverhalten von `GET /documents`**, insbesondere sobald
  ein realer `D3CloudDocumentProvider` den `StubDocumentProvider` ersetzt:
  Unterscheidung zwischen "0 Dokumente vorhanden" (normal) und
  "D3-Cloud-Anbindung nicht erreichbar" (Verfügbarkeitsproblem) wäre dann
  ein sinnvolles Signal — aktuell nicht möglich/nicht nötig, da der Stub
  immer `[]` liefert.
- **Fehlgeschlagene `supplierGpa`-Zuordnungen im künftigen Ingestion-Adapter**
  (z. B. eingehende Datensätze, deren `supplierGpa` zu keinem bekannten
  Lieferanten passt) als Frühindikator für ein falsches GPA-Mapping
  (Gate-Punkt 2) — würde helfen, eine falsche Annahme über die
  Lobster-Schnittstelle zeitnah nach Produktivstart zu erkennen, statt erst
  über Lieferanten-Beschwerden.
- **Explizit kein Logging sensibler Inhalte:** Abrufnummer, Lieferdatum/
  -Uhrzeit, Sorte und GPA sind laut ADR 0009 "Teilweise" bzw.
  Stammdaten-sensibel — jedes künftige Logging-Konzept muss, wie bereits für
  ERP/Lobster/Login-Daten dokumentiert, ohne Klartext-Ausgabe dieser Felder
  auskommen; DevOps stellt nur sicher, dass ein Log-Ziel mit eingeschränktem
  Zugriff bereitsteht, sobald Architect/Security ein Audit-Log-Konzept
  liefern (Security-/QA-Befund: Audit-Logging fehlt vollständig, ist aber
  keine neue, story-spezifische Blockade).

## Design-System- und Routing-Konsequenz (`react-router-dom`, CSS-Tokens)

**Für den heutigen Umfang unkritisch — keine CI-/Build-Anpassung nötig.**

- `react-router-dom` ist laut ADR 0009 "eine neue, aber bewusst kleine
  Laufzeitabhängigkeit" — kein vollständiges UI-Kit, keine zusätzliche
  Build-Toolchain (Vite/`tsc` bauen es wie jede andere npm-Abhängigkeit mit).
  Der bestehende `build`-Job (`npm run build --workspace=apps/web`) deckt
  das bereits ab; Security hat zusätzlich bestätigt, dass keine neue
  Angriffsfläche entstanden ist (keine offenen Redirects, kein
  `dangerouslySetInnerHTML`).
- Das interne Design-System (`apps/web/src/design-system/*`) besteht aus
  CSS Custom Properties und CSS Modules, keiner zusätzlichen
  Build-Abhängigkeit (Vite unterstützt CSS Modules bereits nativ) — auch
  hier keine neue CI-Stufe erforderlich.
- **Bundle-Size-Beobachtung: aktuell kein akuter Bedarf, aber ein
  naheliegender Vorschlag für eine spätere Iteration.** Mit
  `react-router-dom` als erster "echter" Laufzeitabhängigkeit über
  `oidc-client-ts`/`react-oidc-context` hinaus wächst das Web-Bundle
  spürbar zum ersten Mal seit dem initialen Login-Konturwurf. Beim
  heutigen, noch kleinen Funktionsumfang (eine Liste, eine Detailseite,
  eine Sammel-Ansicht) ist das kein Problem, das eine sofortige
  CI-Maßnahme rechtfertigt. Sollte der UI-Funktionsumfang weiter wachsen
  (mehr Routen, mehr Design-System-Komponenten, ggf. künftig doch eine
  externe UI-Bibliothek gemäß ADR 0009 "Konsequenzen"), wäre ein einfacher
  Bundle-Size-Check (z. B. `vite build` mit `--report` bzw. ein
  Size-Limit-Tool als zusätzlicher, optionaler CI-Schritt) eine sinnvolle
  spätere Ergänzung — hier bewusst nur vorgemerkt, nicht implementiert, da
  aktuell keine Notwendigkeit besteht (kein spekulativer Ausbau der
  Pipeline auf Vorrat).
