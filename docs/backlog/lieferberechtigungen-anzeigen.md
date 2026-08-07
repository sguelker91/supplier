# Lieferberechtigungen anzeigen

## Kontext
Lieferberechtigungen (`DeliveryAuthorization`) werden nicht lokal im
Extranet verwaltet, sondern stammen — analog zu Kontrakten (siehe
[ADR 0001](../architecture/adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
und `docs/backlog/lieferant-kontrakte-einsehen.md`) — aus dem führenden
ERP-System. `apps/api` abstrahiert die konkrete ERP-Anbindung über einen
eigenen Backend-Service; das Extranet selbst dient ausschließlich als
Benutzeroberfläche auf diesen Daten.

Zu einer Lieferberechtigung können zusätzlich Dokumente existieren. Diese
Dokumente werden **nicht** im ERP-System gespeichert, sondern künftig über
eine separate "D3 Cloud"-API bereitgestellt. Diese Story fordert deshalb
ausdrücklich, dass die Dokumentenanzeige von Anfang an über eine eigene,
austauschbare Service-Schnittstelle erfolgt und nicht hart mit dem
ERP-Zugriff der Lieferberechtigungs-Liste verdrahtet wird — auch wenn die
konkrete D3-Cloud-Anbindung selbst nicht Teil dieser Story ist (siehe
Nicht-Ziele).

Ein bestehender Screenshot des alten Lieferantenportals
(`Design/Lieferberechtigungen.png`) diente ausschließlich als **fachliche**
Referenz für vorhandene Funktionen (Zeitraum-Filter, Tabelle mit
Abrufnummer/Lieferdatum/Uhrzeit/Sorte, Mehrfachauswahl, "Alle markieren",
Öffnen-Aktion, Export) — nicht als Layout-/Design-Vorlage. Die visuelle
Umsetzung folgt stattdessen der neuen Design-Referenz (`Design/APP.png`:
helles Karten-Layout, grüner Marken-Akzent, klare Typografie), abgeleitet
für eine responsive Web-Oberfläche (kein 1:1-Kopieren der mobilen
Handy-Mockups). Diese Story ist das **erste Feature**, das ein geteiltes
Design-/Komponentensystem in `apps/web` benötigt (bisher existieren nur
CSS Modules für die `LoginPage`) — Architektur/Umsetzung der
Tabellen-/Filter-Komponenten (generisch, wiederverwendbar, nicht
feature-spezifisch) und des Design-Systems selbst werden vom
Architect-Agenten festgelegt, nicht von dieser Story vorweggenommen.

**Plattform-Scope:** Diese Story deckt ausschließlich `apps/web` ab. Die
Umsetzung in `apps/mobile` ist bewusst **kein** Bestandteil dieser Story
und wird als eigene Folge-Story nachgezogen (siehe Nicht-Ziele).

**Hinweis für Security/QA:** Lieferberechtigungen sind laut Domain-Glossar
DSGVO-technisch als "Teilweise" sensibel eingestuft. Zusätzlich sind
Lieferberechtigungen laut Domain-Glossar immer lieferantenscharf
(GPA-Schlüssel, [ADR 0008](../architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md)) —
Security und QA müssen gezielt auf Mandantentrennung, Zugriffsschutz und den
Umgang mit synthetischen statt echten Lieferantendaten in Tests/Fixtures
prüfen (analog zur bereits bestehenden Kontrakte-Story).

## User Story
Als Lieferant möchte ich meine aktuellen Lieferberechtigungen in der
Extranet-Weboberfläche einsehen, nach einem Zeitraum filtern und einzeln
oder gesammelt öffnen können, damit ich jederzeit selbstständig einen
aktuellen Überblick über meine Lieferberechtigungen habe, ohne dafür
Rückfragen stellen zu müssen.

## Akzeptanzkriterien

### Anzeige
1. **Given** ein Lieferant ist erfolgreich in der Extranet-Weboberfläche
   eingeloggt, **when** er die Seite "Lieferberechtigungen" aufruft,
   **then** wird ihm eine Liste seiner eigenen Lieferberechtigungen
   angezeigt, die aus dem ERP-System stammen und über den in `apps/api`
   gekapselten Backend-Service geladen werden.
2. **Given** die Seite "Lieferberechtigungen" wird angezeigt, **when** sie
   auf einem Desktop- oder einem schmaleren (Tablet-/Mobile-Browser-)
   Viewport dargestellt wird, **then** bleiben Filter, Tabelle und
   Aktionen vollständig bedienbar (responsives Verhalten, keine
   abgeschnittenen/unbedienbaren Elemente).
3. **Given** ein Lieferant navigiert innerhalb des neuen Extranet-Portals,
   **when** er die Seite "Lieferberechtigungen" erreicht, **then** ist sie
   über dieselbe Navigationsstruktur erreichbar wie andere Portalbereiche
   (z. B. Kontrakte) und optisch/strukturell konsistent mit dem neuen
   Design-System.

### Filter
4. **Given** ein Lieferant öffnet die Seite "Lieferberechtigungen",
   **when** die Seite initial lädt, **then** ist ein Zeitraum-Filter
   (Datum von/bis) mit einem sinnvollen Standardzeitraum bereits
   vorbelegt und die Liste zeigt die dazu passenden Lieferberechtigungen.
5. **Given** ein Lieferant ändert den Zeitraum-Filter (Datum von und/oder
   bis), **when** die Änderung übernommen wird, **then** aktualisiert
   sich die Tabelle automatisch auf die Lieferberechtigungen im neu
   gewählten Zeitraum, ohne dass eine bestehende Mehrfachauswahl aus
   einem vorherigen Zeitraum fälschlich auf nun nicht mehr angezeigte
   Zeilen "unsichtbar" bestehen bleibt (siehe AC9 zum Auswahlverhalten).

### Tabelle
6. **Given** Lieferberechtigungen werden angezeigt, **when** die Tabelle
   gerendert wird, **then** enthält jede Zeile mindestens die Spalten
   Abrufnummer, Lieferdatum, Uhrzeit und Sorte.
7. **Given** die Tabelle zeigt Lieferberechtigungen an, **when** eine
   Zeile betrachtet wird, **then** besitzt sie eine Checkbox zur
   Auswahl sowie eine Aktion "Öffnen".
8. **Given** die Tabelle zeigt mehrere Lieferberechtigungen an, **when**
   der Lieferant "Alle markieren" aktiviert, **then** werden alle aktuell
   in der Tabelle sichtbaren Lieferberechtigungen als ausgewählt markiert;
   ein erneutes Deaktivieren hebt die Auswahl aller Zeilen wieder auf.
9. **Given** ein Lieferant hat einzelne oder mehrere Lieferberechtigungen
   per Checkbox markiert, **when** er anschließend andere, nicht mit der
   Auswahl zusammenhängende Interaktionen auf der Seite durchführt (z. B.
   Scrollen), **then** bleibt die Auswahl unverändert erhalten, bis der
   Lieferant sie aktiv ändert (einzelne Checkbox, "Alle markieren"/
   "Alle abwählen" oder Zeitraum-Filter-Änderung gemäß AC5).

### Aktionen
10. **Given** eine einzelne Lieferberechtigung wird über die Aktion
    "Öffnen" in ihrer Zeile geöffnet, **when** die Aktion ausgelöst wird,
    **then** wird genau diese eine Lieferberechtigung geöffnet (konkretes
    Zielverhalten — Detailansicht vs. Dokumentenanzeige — ist als offene
    Frage vermerkt, siehe unten).
11. **Given** mehrere Lieferberechtigungen sind markiert, **when** der
    Lieferant die Aktion zum gemeinsamen Öffnen der markierten
    Lieferberechtigungen auslöst, **then** werden alle markierten
    Lieferberechtigungen gemeinsam geöffnet (z. B. als Sammelaktion), ohne
    dass nicht markierte Zeilen einbezogen werden.
12. **Given** keine Lieferberechtigung ist markiert, **when** die Seite
    angezeigt wird, **then** ist die Aktion zum gemeinsamen Öffnen
    markierter Lieferberechtigungen erkennbar deaktiviert oder nicht
    verfügbar (keine Aktion ohne Auswahl auslösbar).

### Dokumente (Service-Abstraktion)
13. **Given** das Öffnen einer Lieferberechtigung (einzeln oder gesammelt)
    zeigt zugehörige Dokumente an, **when** diese Dokumente geladen
    werden, **then** erfolgt der Zugriff ausschließlich über eine eigene,
    von der ERP-Lieferberechtigungs-Abfrage getrennte Service-Schnittstelle
    (Platzhalter/Anbindungspunkt für die künftige D3-Cloud-API), sodass die
    reale D3-Cloud-Anbindung später ohne Änderung an der
    Lieferberechtigungs-Kernlogik nachgerüstet werden kann.

### Mandantentrennung / Sicherheit
14. **Given** ein Lieferant ist eingeloggt, **when** er auf die
    Lieferberechtigungs-Liste oder eine einzelne/gemeinsame
    Öffnen-Aktion zugreift, **then** werden ausschließlich
    Lieferberechtigungen angezeigt bzw. verarbeitet, die über den
    GPA-Mandantenschlüssel (ADR 0008) diesem Lieferanten zugeordnet sind;
    ein Zugriff auf Lieferberechtigungen anderer Lieferanten (z. B. über
    direkte ID-Manipulation beim Öffnen) wird serverseitig abgelehnt und
    mit einem eindeutigen Fehlerstatus (z. B. 403) quittiert.

### UX-Zustände
15. **Given** die Lieferberechtigungs-Liste wird angefragt (initial oder
    nach Filteränderung), **when** die Antwort noch aussteht, **then**
    wird ein klar erkennbarer Ladezustand angezeigt (kein leerer/
    eingefrorener Bildschirm).
16. **Given** für den gewählten Zeitraum liegen keine Lieferberechtigungen
    vor, **when** die Liste angezeigt wird, **then** wird ein
    benutzerfreundlicher Leer-Zustand dargestellt (z. B. "Keine
    Lieferberechtigungen im gewählten Zeitraum") statt einer leeren
    Tabelle ohne Erklärung.
17. **Given** das Laden der Lieferberechtigungen oder das Öffnen einer/
    mehrerer Lieferberechtigungen schlägt fehl (z. B. Backend-/
    ERP-Fehler), **when** der Fehler auftritt, **then** wird dem
    Lieferanten eine verständliche Fehlermeldung angezeigt, keine
    stillschweigend leere oder falsche Liste.

### Tests
18. Es existieren automatisierte Unit-/Integrationstests mindestens für:
    Zeitraum-Filter (Standardwert und Änderungsverhalten gemäß AC4/AC5),
    Mehrfachauswahl (AC7/AC9), "Alle markieren" inkl. Abwählen (AC8),
    Öffnen einer einzelnen Lieferberechtigung (AC10) und Öffnen mehrerer
    markierter Lieferberechtigungen (AC11).

## Betroffene Domänenbegriffe
- Lieferberechtigung (`DeliveryAuthorization`)
- Lieferant
- ERP-System
- Beleg (Oberbegriff, sofern die künftige D3-Cloud-Dokumentenanzeige als
  `Document` eingeordnet wird — siehe Offene Fragen)
- GPA / Geschäftspartnernummer (Mandantentrennung)

## Nicht-Ziele
- Keine Umsetzung in `apps/mobile` — das ist ausdrücklich eine separate
  Folge-Story, sobald `apps/web` vollständig umgesetzt ist.
- Kein Bearbeiten, Anlegen oder Löschen von Lieferberechtigungen durch den
  Lieferanten (reine Leseansicht mit Öffnen-Aktion).
- Keine reale Anbindung der D3-Cloud-Dokumenten-API — nur die
  Service-Schnittstelle/der Anbindungspunkt dafür ist Teil dieser Story
  (siehe AC13); die konkrete D3-Cloud-Integration ist eine eigene,
  spätere Aufgabe.
- Kein Export (z. B. CSV/Excel) der Lieferberechtigungs-Liste, auch wenn
  das alte Portal einen Export-Link zeigte — falls gewünscht, eigene
  Folge-Story.
- Keine Definition/Festlegung des unternehmensweiten Design-Systems
  selbst (Farben, Tokens, Komponentenbibliothek als Ganzes) — das ist
  Aufgabe des Architect-Agenten; diese Story fordert lediglich, dass
  Styling ausschließlich darüber erfolgt und Tabellen-/Filter-Komponenten
  generisch/wiederverwendbar sind.
- Keine Änderung an der Lobster-/ERP-Synchronisationslogik selbst; es wird
  vorausgesetzt, dass Lieferberechtigungsdaten bereits über bestehende
  Schnittstellen ins Extranet gelangen (analog zu Kontrakten).
- Keine Verknüpfung/Anzeige von Kontrakten, Abnahmescheinen oder
  Mengenmeldungen innerhalb dieser Ansicht (eigenständige fachliche
  Objekte, eigene Stories).

## Offene Fragen
- Was genau bedeutet "Öffnen" einer Lieferberechtigung fachlich: eine
  Detailansicht innerhalb des Extranets, das Öffnen eines zugehörigen
  Dokuments aus der D3 Cloud, oder beides je nach Kontext? Die
  Fachbeschreibung erwähnt Dokumente separat von der Kernanzeige — dies
  muss vor der technischen Umsetzung mit Architect/Fachseite geklärt
  werden.
- Welche Felder/Attribute einer Lieferberechtigung gelten über die vier
  Pflichtspalten (Abrufnummer, Lieferdatum, Uhrzeit, Sorte) hinaus als
  relevant für Liste oder Detailansicht?
- Wie wird der "sinnvolle Standardzeitraum" für den Filter fachlich
  definiert (z. B. laufender Monat, kommende N Tage, letzte N Tage)?
- Wie ist der Umgang mit Lieferberechtigungen zu regeln, deren Zeitraum
  bereits abgelaufen ist — werden sie weiterhin unbegrenzt anzeigbar
  gehalten oder nach einer Frist ausgeblendet?
- Wie wird die Mandantentrennung technisch abgesichert (serverseitige
  Autorisierung pro Lieferberechtigungs-ID vs. rein UI-seitige Filterung)?
  Zu klären mit Architect/Security, analog zur bestehenden
  Kontrakte-Story.
- Wie soll die künftige D3-Cloud-Service-Schnittstelle konkret aussehen
  (Vertrag/Datenkontrakt, Authentifizierung, Fehlerverhalten bei
  nicht erreichbarer D3-Cloud)? Das ist eine Architect-ADR-Aufgabe,
  analog zu ADR 0001 für Kontrakte.
- Ist für das gemeinsame Öffnen mehrerer Lieferberechtigungen ein
  Sammel-Dokument/eine Sammelansicht vorgesehen, oder werden mehrere
  Einzelansichten/-Dokumente parallel geöffnet? Fachlich nicht eindeutig
  aus der Anforderung ableitbar.
- Wird für Lesezugriffe auf Lieferberechtigungen ein Audit-Log benötigt
  (DSGVO-Rechenschaftspflicht), analog zu den bereits für Kontrakte
  diskutierten Empfehlungen?
- Wie aktuell müssen die Lieferberechtigungsdaten aus dem ERP-System sein
  (Synchronisationsintervall), und soll dem Lieferanten ein
  Datenstand-/Sync-Hinweis angezeigt werden (analog zur Kontrakte-Story,
  AC6 dort)?

## Implementierungsnotizen

Umsetzung gemäß
[ADR 0009](../architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md),
ausschließlich `apps/web` + `apps/api` (kein `apps/mobile`, wie gefordert).

### Was wurde gebaut

**Design-System (`apps/web/src/design-system/`)**
- `tokens.css` (1:1 wie ADR 0009 Abschnitt 1, inkl. der dort explizit als
  Näherungswerte markierten Hex-Farben), global in `main.tsx` importiert.
- `Card.tsx`, `AppShell.tsx` (statische Navigationsliste, `NavLink` aus
  `react-router-dom`), `DataTable.tsx` und `DateRangeFilter.tsx` — Interfaces
  exakt wie in ADR 0009 Abschnitt 4/5 skizziert (`DataTableColumn<T>`,
  `DataTableSelectionProps`, `DataTableProps<T>`, `DateRangeValue`,
  `DateRangeFilterProps`). `DataTable` ist fully-controlled bzgl. Auswahl,
  `DataTable` selbst hält keinen Auswahl-State; horizontal scrollbarer
  Tabellen-Container (`overflow-x: auto`) statt Spalten-Ausblendung (AC2).
  Jede Komponente hat einen `*.spec.tsx`-Test (RTL), analog `LoginPage.spec.tsx`.

**Routing (`apps/web`)**
- `react-router-dom` als reguläre npm-Dependency ergänzt
  (`npm install react-router-dom --workspace=apps/web`, kein Netzwerkproblem
  — der Registry-Host ist von der Proxy-Sandbox ausgenommen). Installierte
  Version ist `^7.18.2` (React-Router v7). Die in ADR 0009 verwendeten APIs
  (`BrowserRouter`, `Routes`/`Route`, `Navigate`, `NavLink`, `useNavigate`,
  `useParams`, `useSearchParams`) existieren in v7 unverändert zu v6 — keine
  fachliche Abweichung von der ADR-Skizze, nur eine neuere Paketversion.
- `App.tsx` umgestellt: `AUTH_CALLBACK_PATH` ist jetzt eine reguläre Route
  außerhalb von `ProtectedArea` (statt manuellem
  `window.location.pathname`-Vergleich); `Portal`-Komponente kapselt
  `ProtectedArea` + `AppShell` + die eigentlichen Routen
  (`/`, `/contracts`, `/delivery-authorizations`,
  `/delivery-authorizations/:id`, `/delivery-authorizations/open`), genau
  wie in ADR 0009 Abschnitt 2 skizziert. Bestehende Tests (`App.spec.tsx`,
  `ProtectedArea.spec.tsx`, `LoginPage.spec.tsx`, `LogoutButton.spec.tsx`,
  `AuthCallbackPage.spec.tsx`) bleiben unverändert grün.

**Backend `apps/api/src/delivery-authorizations/`**
- Types, Repository-Interface + `InMemoryDeliveryAuthorizationRepository`
  (vier synthetische Fixtures über zwei `supplierId`-Werte,
  `supplier-synthetic-a`/`-b`), Service, Controller, Module — strukturell
  identisch zum `contracts`-Modul-Muster. `GET /delivery-authorizations`
  verlangt `from`/`to` (400 bei Fehlen/ungültigem ISO-8601-Datum/
  `from > to`, siehe `date-range.util.ts`), filtert serverseitig nach der
  `supplierId` aus dem verifizierten Auth-Kontext.
  `GET /delivery-authorizations/:id` repliziert exakt das
  404/403/200-Verhalten aus `contracts.controller.ts` (ADR 0002 Punkt 4).
  E2E-Test (`test/delivery-authorizations.e2e-spec.ts`) deckt explizit den
  Mandantentrennungsfall "Lieferant A kann Lieferberechtigung von
  Lieferant B nicht lesen -> 403" sowie 400/404/401 ab.

**Backend `apps/api/src/documents/`**
- `DocumentSubjectType`/`DocumentSubjectReference`/`DocumentReference`/
  `DocumentProvider` exakt wie ADR 0009 Abschnitt 8, `StubDocumentProvider`
  (liefert immer `[]`, klar als Übergangslösung kommentiert), DI-Token
  `DOCUMENT_PROVIDER`. `DocumentsController` führt die von der ADR
  geforderte ZUSÄTZLICHE Ownership-Prüfung über
  `DeliveryAuthorizationsService.getMyDeliveryAuthorizationById(...)` durch,
  bevor er überhaupt an `DocumentProvider` delegiert.
  `test/documents.e2e-spec.ts` deckt gezielt die in der ADR beschriebene
  Lücke ab: `GET /documents?subjectType=delivery-authorization&subjectId=<fremde-id>`
  liefert 403 (Kern-Assertion: `response.body` ist NICHT `[]`), statt dass
  der Stub-Provider unterschiedslos `200 []` für jede `subjectId` liefert.

**Frontend `apps/web/src/delivery-authorizations/`**
- `DeliveryAuthorizationsListPage.tsx`: `DateRangeFilter` + `DataTable` +
  `Card`, echter Datenabruf über `delivery-authorization-client.ts`
  (Access-Token aus `useAuth()`, `fetch` gegen `GET /delivery-authorizations`).
  Auswahl-State (`selectedIds`) lebt in der Seite; wird bei
  Zeitraum-Änderung aktiv zurückgesetzt (AC5/AC9); "Alle markieren" bezieht
  sich nur auf sichtbare Zeilen (AC8, über `DataTable`s Selection-Prop);
  Sammel-Öffnen-Button ist ohne Auswahl deaktiviert (AC12); Lade-/Leer-/
  Fehlerzustände über `DataTable`s `isLoading`/`emptyState`/`error` (AC15-17).
- `DeliveryAuthorizationDetailPage.tsx`: lädt `GET /delivery-authorizations/:id`,
  zeigt die vier Pflichtfelder, lädt zusätzlich (nicht-blockierend, Fehler
  werden bewusst verschluckt) Dokumente über `GET /documents` nach (AC13).
- `DeliveryAuthorizationsOpenPage.tsx` (`/delivery-authorizations/open?ids=a,b,c`):
  rendert `DeliveryAuthorizationDetailPage` je ID **untereinander**
  (gewählte Variante der in ADR 0009 offengelassenen Frage
  "nacheinander vs. untereinander").
- Navigation über `AppShell` zwischen "Kontrakte" und "Lieferberechtigungen"
  (AC3), Öffnen-Aktionen navigieren clientseitig (kein Modal/Download,
  ADR 0009 Abschnitt 7).
- Tests: `DeliveryAuthorizationsListPage.spec.tsx` deckt AC4/AC5/AC8/AC9/
  AC10/AC11/AC12/AC15-17 ab (Fetch-Funktion wird als Prop injiziert, kein
  echter `fetch`-Mock nötig); `DeliveryAuthorizationDetailPage.spec.tsx` und
  `DeliveryAuthorizationsOpenPage.spec.tsx` decken AC10/AC11/AC13 ab.

### Abweichungen von der ADR und warum

- **Sync-Metadaten sind ein reiner Platzhalter, kein `DeliveryAuthorizationSyncRun`.**
  ADR 0009 nennt `DeliveryAuthorizationSyncRun` nur als "strukturell
  identisch zu `ContractSyncRun`", skizziert ihn aber nicht — und
  `ContractSyncRun`/eine echte Sync-Historie sind laut bestehender
  Implementierungsnotiz zu `lieferant-kontrakte-einsehen` ebenfalls nicht
  umgesetzt (nur ein TODO in `ContractsService`). Konsequent dazu liefert
  `DeliveryAuthorizationsController` `lastSuccessfulSyncAt: null,
  isStale: false` als hart codierten Platzhalter (mit TODO-Kommentar),
  keine eigene ADR-Erfindung, sondern dieselbe bewusste Lücke wie bei
  Kontrakten.
- **`AuthenticatedSupplierContext` wird aus `contracts/contract.types.ts`
  wiederverwendet**, nicht in `delivery-authorizations` neu definiert. Die
  ADR äußert sich dazu nicht explizit; da der Typ im bestehenden Code
  bereits die kanonische, modulübergreifend importierte Quelle ist (siehe
  `auth-context.decorator.ts`, `zitadel-auth.guard.ts`), wäre eine zweite
  Definition eine unnötige Duplikation ohne Mehrwert.
- **`API_BASE_URL` ist ein hart codierter Platzhalter**
  (`apps/web/src/api-client/api-config.ts`, `http://localhost:3000`),
  analog zur bereits bestehenden, dokumentierten Lücke bei
  `ZITADEL_ISSUER`/`ZITADEL_WEB_CLIENT_ID` (kein Env-/Secrets-Konzept für
  `apps/web` entschieden). Für lokale Entwicklung funktional, aber nicht
  Staging-/Produktions-tauglich — offener Punkt, keine ADR-Vorwegnahme.
- **Standardzeitraum-Platzhalter**: `date-range-default.ts` verwendet
  "heute bis heute + 30 Tage", klar als PLATZHALTER kommentiert (ADR 0009
  Abschnitt 6/„Offene Annahmen“ verlangt ausdrücklich keine fachliche
  Festlegung vor Product-Klärung).
- **Infrastruktur-Fix in `css-module-mock.cjs`** (nicht Teil der ADR, aber
  nötig, um `AppShell.spec.tsx` korrekt zu testen): Der bisherige
  Jest-Mock für `*.module.css`-Importe gab für JEDEN String-Property-Zugriff
  unterschiedslos den Property-Namen zurück — inklusive `__esModule`. Das
  ließ TypeScripts `esModuleInterop`-Hilfsfunktion (`__importDefault`) den
  Mock fälschlich als bereits transpiliertes ESM-Modul erkennen, wodurch
  ein `import styles from './x.module.css'`-Default-Import den String
  `"default"` statt des Mock-Proxys selbst erhielt. Bestehende Tests
  (`LoginPage.spec.tsx` etc.) haben das nie bemerkt, weil sie nie auf
  konkrete Klassennamen prüfen — `AppShell.spec.tsx` (`toHaveClass(...)`,
  gefordert um die Aktiv-Kennzeichnung der Navigation zu verifizieren) hat
  den Fehler aufgedeckt. Fix: `__esModule` liefert jetzt explizit
  `undefined`. Kein Verhalten für bestehende Tests geändert (weiterhin alle
  grün), nur der zuvor nie geprüfte Fall korrigiert.
- **Detailansicht zeigt ausschließlich die vier Pflichtfelder** (Abrufnummer,
  Lieferdatum, Uhrzeit, Sorte) — laut Backlog ("Offene Fragen") ist der
  vollständige Feldkatalog für die Detailansicht ungeklärt; keine
  spekulativen Zusatzfelder ergänzt.
- **Kein Audit-Logging, keine Synchronisations-/Datenstand-Anzeige für
  Lieferberechtigungen** umgesetzt — beides laut Backlog ausdrücklich offene
  Fragen, nicht Teil dieser ADR/Story.

### Test-/Typecheck-Status

- `npm run typecheck --workspaces`: grün (api, web, mobile).
- `npm test --workspaces`: grün (api: 42 Tests/6 Suiten inkl. der zwei neuen
  E2E-Suiten; web: 53 Tests/14 Suiten inkl. aller neuen Design-System- und
  Lieferberechtigungs-Tests; mobile: unverändert, nicht Teil dieser Story).
- Ausschließlich synthetische Testdaten in allen neuen Fixtures/Tests
  (`supplier-synthetic-a`/`-b`, `SYNTH-ABRUF-*`), keine echten
  Lieferanten-/Finanzdaten.
