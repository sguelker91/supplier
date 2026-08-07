# QA-Bericht: Lieferberechtigungen anzeigen

## Vorbemerkung zum Prüfstand

Geprüft wurden `apps/web` und `apps/api` gemäß
[Backlog](../backlog/lieferberechtigungen-anzeigen.md) (18 Akzeptanzkriterien)
und [ADR 0009](../architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md)
(8 Architekturentscheidungen). Ich habe `npm run typecheck --workspaces` und
`npm test --workspaces` selbst ausgeführt (nicht nur dem Implementierungsbericht
vertraut):

```
npm run typecheck --workspaces
api / web / mobile: alle drei ohne Fehler

npm test --workspaces
API:    6 Suites, 42 Tests — grün
Web:    14 Suites, 53 Tests — grün
Mobile: 6 Suites, 21 Tests — grün (unverändert, nicht Teil dieser Story)
```

Das deckt sich mit der Implementierungsnotiz am Ende des Backlog-Files.

Geprüfter Code (Review, nicht nur Testlauf):
`apps/api/src/delivery-authorizations/*.ts` (inkl.
`delivery-authorizations.controller.ts`, `.service.ts`,
`.service.spec.ts`, `in-memory-delivery-authorization.repository.ts`,
`date-range.util.ts`), `apps/api/src/documents/*.ts` (Controller, Module,
Types, `StubDocumentProvider`), `apps/api/test/delivery-authorizations.e2e-spec.ts`,
`apps/api/test/documents.e2e-spec.ts`, `apps/web/src/design-system/{Card,AppShell,DataTable,DateRangeFilter}.tsx`
+ jeweilige `.spec.tsx` + `.module.css`, `apps/web/src/delivery-authorizations/*`
(ListPage, DetailPage, OpenPage, Client, `date-range-default.ts`) + Tests,
`apps/web/src/App.tsx` + `App.spec.tsx`, `apps/web/src/auth/ProtectedArea.spec.tsx`,
`apps/web/src/contracts/ContractsListPage.spec.tsx`, `apps/web/src/api-client/api-config.ts`.

Anders als bei der Story `lieferanten-anmeldung-gpa` ist dieses Feature
fachlich **vollständig innerhalb des Repo-Scopes prüfbar** (keine externe
Okta-/ZITADEL-Abhängigkeit im Kernablauf) — alle 18 AC lassen sich direkt
gegen Code und Tests bewerten, ohne "nicht in diesem Repo prüfbar"
klassifizieren zu müssen.

## Testfälle

| ID | Szenario | Erwartetes Ergebnis | Status |
|---|---|---|---|
| TC-01 (AC1) | Eingeloggter Lieferant ruft `/delivery-authorizations` auf | Liste eigener Lieferberechtigungen, geladen über `apps/api`-Endpunkt | **Bestanden.** `DeliveryAuthorizationsListPage` ruft `fetchMyDeliveryAuthorizations` → `GET /delivery-authorizations` (`delivery-authorization-client.ts`); Backend liefert ausschließlich Daten der `supplierId` aus dem Auth-Kontext (`delivery-authorizations.service.ts:44`). E2E-Test bestätigt 200 + korrekt gescopte Items. |
| TC-02 (AC2, Responsive) | Darstellung auf schmalem Viewport | Filter/Tabelle/Aktionen bleiben bedienbar, keine abgeschnittenen Elemente | **Bestanden, aber nur strukturell/CSS-seitig geprüft, kein echter Viewport-Test.** `DataTable.module.css`: `.tableContainer { overflow-x: auto; }` statt Spalten-Ausblendung, exakt wie ADR 0009 Abschnitt 4 gefordert. Es gibt **keinen** automatisierten Test, der tatsächlich eine schmale Viewport-Breite simuliert (RTL/JSDOM prüft kein CSS-Rendering/Scrollverhalten) — das ist eine plausible Lücke in AC18 ("Tests"), die AC2 aber nicht explizit als zu testendes Kriterium benennt. Kein Blocker, aber Hinweis: rein visuelle/CSS-Eigenschaften sind derzeit nur durch Code-Review, nicht durch Test abgesichert. |
| TC-03 (AC3, Navigation) | Navigation zwischen Kontrakten und Lieferberechtigungen | Gleiche Navigationsstruktur, optisch/strukturell konsistent | **Bestanden.** `AppShell.spec.tsx` prüft echte Links (`href`) zu `/contracts` und `/delivery-authorizations` sowie Aktiv-Kennzeichnung (`toHaveClass('navLinkActive')`) über `NavLink`. `App.tsx` bindet beide Routen in dieselbe `AppShell`-Navigationsliste ein. |
| TC-04 (AC4, Standardzeitraum) | Initiales Laden der Seite | Zeitraum-Filter mit sinnvollem Standardwert vorbelegt, passende Liste geladen | **Bestanden im Rahmen des dokumentierten Platzhalters.** `getDefaultDeliveryAuthorizationDateRange()` liefert "heute bis heute+30 Tage", **explizit als PLATZHALTER kommentiert** (keine fachliche Festlegung, siehe unten "Offene Fragen"). Test `lädt initial mit einem vorbelegten Zeitraum-Filter (AC4)` prüft nur das Format (`^\d{4}-\d{2}-\d{2}$`), nicht den konkreten Wert — konsistent mit der bewusst offengelassenen fachlichen Frage. |
| TC-05/TC-06 (AC5/AC9, Auswahl-Reset vs. -Erhalt) | Zeitraum ändern vs. andere Interaktion | Auswahl wird bei Zeitraum-Änderung zurückgesetzt, bleibt sonst erhalten | **Bestanden, echt verifiziert (siehe vertiefte Prüfung unten).** |
| TC-07 (AC6, Pflichtspalten) | Tabelle rendert Zeilen | Mindestens Abrufnummer/Lieferdatum/Uhrzeit/Sorte je Zeile | **Bestanden.** `COLUMNS` in `DeliveryAuthorizationsListPage.tsx` deckt exakt diese vier Felder ab; `DataTable.spec.tsx` prüft generisch das Spalten-Rendering, `DeliveryAuthorizationsListPage`-eigene Tests prüfen konkrete Werte (`SYNTH-ABRUF-1` etc. sichtbar). |
| TC-08 (AC7, Checkbox + Öffnen je Zeile) | Zeile einer Lieferberechtigung | Checkbox zur Auswahl + Aktion "Öffnen" vorhanden | **Bestanden.** `DataTable.spec.tsx` ("rendert eine Zeile pro Eintrag mit Checkbox und Öffnen-Aktion") und `DeliveryAuthorizationsListPage.spec.tsx` (Öffnen-Button pro Zeile, navigiert zu Detailseite). |
| TC-09 (AC8, "Alle markieren" + Abwählen) | Mehrere Zeilen, "Alle markieren" aktivieren/deaktivieren | Alle sichtbaren Zeilen markiert, erneutes Deaktivieren hebt alles wieder auf | **Bestanden, echt verifiziert (siehe vertiefte Prüfung unten).** |
| TC-10 (AC10, Einzel-Öffnen) | "Öffnen" einer Zeile | Genau diese eine Lieferberechtigung wird geöffnet (Navigation zu Detailseite) | **Bestanden.** `DeliveryAuthorizationsListPage.spec.tsx` ("navigiert beim einzelnen Öffnen zur Detailansicht dieser einen Lieferberechtigung") prüft echte Navigation via `MemoryRouter`+`Routes`, nicht nur Funktionsaufruf. |
| TC-11 (AC11, Sammel-Öffnen) | Mehrere Zeilen markiert, Sammel-Öffnen ausgelöst | Alle markierten (und nur diese) werden gemeinsam geöffnet | **Bestanden.** `DeliveryAuthorizationsListPage.spec.tsx` navigiert mit `ids=` aller markierten Zeilen zu `/delivery-authorizations/open`; `DeliveryAuthorizationsOpenPage.spec.tsx` verifiziert, dass pro ID eine Detailkomponente gerendert wird (nicht mehr, nicht weniger). |
| TC-12 (AC12, Sammel-Öffnen ohne Auswahl deaktiviert) | Keine Auswahl vorhanden | Sammel-Öffnen-Button erkennbar deaktiviert | **Bestanden, echt verifiziert (siehe vertiefte Prüfung unten).** |
| TC-13 (AC13, Dokumenten-Service-Trennung) | Öffnen einer Lieferberechtigung lädt Dokumente | Zugriff über separate, austauschbare Service-Schnittstelle, nicht hart mit ERP-Abfrage verdrahtet | **Bestanden, echt verifiziert (siehe vertiefte Prüfung unten).** |
| TC-14 (AC14, Mandantentrennung Liste + Einzelzugriff) | Fremder Zugriff via ID-Manipulation | Serverseitige Ablehnung mit eindeutigem Fehlerstatus (403) | **Bestanden.** `delivery-authorizations.e2e-spec.ts`: Lieferant A ruft Lieferberechtigung von Lieferant B ab → 403, `response.body` explizit ohne `callOffNumber`. Zusätzlich Unit-Test in `delivery-authorizations.service.spec.ts` (403 vs. 404 vs. 200, sowie "vermischt niemals Lieferberechtigungen unterschiedlicher Lieferanten"). |
| TC-15 (AC14 erweitert, Mandantentrennung `/documents`) | Fremder Zugriff auf Dokumente via `subjectId`-Manipulation | 403, nicht die leere Stub-Liste | **Bestanden, echt verifiziert (siehe vertiefte Prüfung unten) — dies ist der laut ADR 0009 kritischste Einzelpunkt und wurde gezielt geprüft.** |
| TC-16 (AC15, Ladezustand) | Anfrage steht aus | Klar erkennbarer Ladezustand | **Bestanden.** `DataTable` zeigt `role="status"` bei `isLoading`; `DeliveryAuthorizationsListPage.spec.tsx` und `DeliveryAuthorizationDetailPage.spec.tsx` prüfen das jeweils mit einer nie auflösenden Promise. |
| TC-17 (AC16, Leer-Zustand) | Kein Ergebnis im Zeitraum | Benutzerfreundlicher Leer-Zustand statt leerer Tabelle | **Bestanden.** `DataTable` zeigt `emptyState` statt `<table>` (verifiziert: `queryByRole('table')` nicht vorhanden); Seiten-Test prüft konkreten Text "Keine Lieferberechtigungen im gewählten Zeitraum." |
| TC-18 (AC17, Fehlerbehandlung) | Laden/Öffnen schlägt fehl | Verständliche Fehlermeldung, keine stillschweigend leere/falsche Liste | **Bestanden für die Liste und die Detailansicht der Kerndaten.** `DeliveryAuthorizationsListPage.spec.tsx`/`DeliveryAuthorizationDetailPage.spec.tsx` zeigen `role="alert"` mit der tatsächlichen Fehlermeldung. **Eingeschränkt für Dokumente (AC13-Pfad):** Fehler beim Dokumenten-Laden werden in `DeliveryAuthorizationDetailPage.tsx` bewusst **stillschweigend verschluckt** (Kommentar: "Fehler hier werden bewusst stillschweigend ignoriert") — das ist nachvollziehbar begründet (nicht-blockierend, D3-Cloud existiert real noch nicht), aber technisch eine Abweichung vom Wortlaut von AC17 ("keine stillschweigend leere ... Liste"), wenn auch nur für den optionalen, in dieser Story nicht scharf spezifizierten Dokumenten-Teilpfad. Siehe Befund 1. |
| TC-19 (AC18, Testabdeckung) | — | Automatisierte Tests für Zeitraum-Filter, Mehrfachauswahl, "Alle markieren", Einzel-/Sammel-Öffnen | **Bestanden.** Alle fünf explizit geforderten Testbereiche sind vorhanden und – wie unten vertieft geprüft – inhaltlich aussagekräftig, nicht nur Behauptungen. |
| TC-20 (Regression) | Bestehender Login-Flow/Kontrakte-Seite nach Routing-Umstellung | Unverändertes Verhalten, weiterhin grüne Tests | **Bestanden (siehe Abschnitt "Regressionsprüfung" unten).** |

## Vertiefte Prüfung AC5/AC9 (Auswahl-Reset bei Zeitraum-Änderung vs. Erhalt sonst)

- **Reset-Pfad (AC5):** `DeliveryAuthorizationsListPage.tsx::handleDateRangeChange`
  ruft explizit `setSelectedIds(new Set())` **zusätzlich** zu
  `setDateRange(next)` auf — kein impliziter Reset über einen `key`-Prop-Trick
  oder Zufall, sondern eine bewusste, separate State-Mutation mit erklärendem
  Kommentar.
- **Test ist echt, nicht nur behauptet:** `DeliveryAuthorizationsListPage.spec.tsx`,
  Test "aktualisiert die Tabelle bei einer Zeitraum-Filter-Änderung und setzt
  eine bestehende Auswahl zurück (AC5/AC9)": markiert zunächst eine Zeile
  (`Ausgewählte öffnen (1)` sichtbar), ändert danach `Lieferdatum von` per
  `fireEvent.change`, wartet auf den zweiten Fetch-Aufruf und die neue Zeile,
  und prüft anschließend explizit `Ausgewählte öffnen (0)`. Das ist eine
  echte End-to-End-Verifikation des Reset-Verhaltens (Auswahl → Filteränderung
  → Auswahl weg), nicht nur ein Test des Zustands nach dem Laden.
- **Erhalt-Pfad (AC9):** `DataTable.spec.tsx`, Test "bleibt bei nicht
  auswahlbezogenen Re-Renders erhalten (AC9, hier: Prop-Update ohne
  Auswahländerung)" verifiziert, dass ein Re-Render mit unveränderten Props
  die Checkbox-Markierung nicht verliert und `onChange` **nicht** aufgerufen
  wird. Das deckt die "Fully-Controlled"-Eigenschaft der `DataTable`
  strukturell ab. Eine Einschränkung: AC9 nennt explizit "Scrollen" als
  Beispiel für eine auswahl-irrelevante Interaktion — dieses konkrete
  Szenario wird nicht wörtlich simuliert (in JSDOM auch kaum sinnvoll
  automatisierbar), aber die Architektur macht "kein Scroll-Handler
  beeinflusst `selectedIds`" strukturell unmöglich (kein Scroll-bezogener
  Code existiert, der `selectedIds` je berühren würde) — die Abdeckung ist
  damit indirekt, aber nachvollziehbar vollständig.

**AC5: bestanden. AC9: bestanden.**

## Vertiefte Prüfung AC8 ("Alle markieren" nur sichtbare Zeilen, Abwählen)

- `DataTable.tsx::toggleAll()`: berechnet `visibleIds` ausschließlich aus den
  aktuell übergebenen `rows` (nicht aus einem größeren serverseitigen
  Bestand), fügt bei nicht vollständig markiertem Zustand alle sichtbaren IDs
  hinzu, entfernt bei vollständig markiertem Zustand alle sichtbaren IDs
  wieder — symmetrisches An-/Abwählen über denselben Codepfad, kein separater,
  potenziell inkonsistenter "Alle abwählen"-Button.
- **Test deckt beide Richtungen echt ab, nicht nur eine:**
  `DataTable.spec.tsx`, Test '"Alle markieren" markiert alle sichtbaren
  Zeilen, erneutes Klicken hebt die Auswahl wieder auf (AC8)' klickt die
  Checkbox zweimal nacheinander und prüft nach jedem Klick beide Zeilen-
  Checkboxen sowie den Zustand der "Alle markieren"-Checkbox selbst
  (`toBeChecked()`/`not.toBeChecked()`). Zusätzlich wiederholt
  `DeliveryAuthorizationsListPage.spec.tsx` denselben Doppel-Klick-Test auf
  Seitenebene und prüft den sichtbaren Zähler ("Ausgewählte öffnen (2)" →
  "(0)"). Kein Test behauptet nur das Markieren, ohne das Abwählen zu prüfen.
- "Nur sichtbare Zeilen": Da `DataTable` keine serverseitige Paginierung
  kennt (alle geladenen `items` sind gleichzeitig "sichtbar"), ist der
  Unterschied zu einem hypothetisch größeren serverseitigen Bestand aktuell
  nicht separat testbar — das ist aber laut ADR 0009 Abschnitt 4 eine
  bewusste Vereinfachung ("kein serverseitig größerer Bestand" ist heute
  ohnehin nicht vorhanden), kein Test-Defizit.

**AC8: bestanden.**

## Vertiefte Prüfung AC12 (Sammel-Öffnen-Button ohne Auswahl deaktiviert)

- Code: `<button ... disabled={selectedIds.size === 0} ...>` in
  `DeliveryAuthorizationsListPage.tsx` — direkte, nachvollziehbare Bindung an
  den Auswahl-State, keine indirekte/verzögerte Ableitung.
- Test: `DeliveryAuthorizationsListPage.spec.tsx`, "die Sammel-Öffnen-Aktion
  ist ohne Auswahl deaktiviert (AC12)" rendert die Seite mit einer
  vorhandenen (aber nicht markierten) Zeile und prüft
  `screen.getByRole('button', { name: /Ausgewählte öffnen/ })).toBeDisabled()`
  — eine echte, spezifische Assertion auf den `disabled`-Zustand, nicht nur
  auf die Existenz des Buttons.

**AC12: bestanden.**

## Vertiefte Prüfung AC13 (Dokumenten-Zugriff über separate Service-Schnittstelle)

- **Modul-Trennung bestätigt:** `apps/api/src/documents/` ist ein eigenständiges
  Nest-Modul mit eigenem `DocumentProvider`-Interface, eigenem DI-Token
  (`DOCUMENT_PROVIDER`) und eigenem `StubDocumentProvider`. Es importiert
  `DeliveryAuthorizationsModule` **ausschließlich**, um
  `DeliveryAuthorizationsService.getMyDeliveryAuthorizationById(...)` für die
  Ownership-Prüfung zu nutzen (siehe AC14-Vertiefung unten) — nicht, um
  Lieferberechtigungsdaten selbst abzufragen oder Dokumente über den
  ERP-Pfad zu laden. Der eigentliche Dokumenten-Zugriff
  (`this.documentProvider.listDocuments(...)`) läuft vollständig über das
  austauschbare Interface, unabhängig vom `delivery-authorizations`-Repository.
- **Frontend-Trennung bestätigt:** `delivery-authorization-client.ts` hat zwei
  klar getrennte Funktionen — `fetchMyDeliveryAuthorizationById` (`GET
  /delivery-authorizations/:id`) und `fetchDocumentsForDeliveryAuthorization`
  (`GET /documents?subjectType=...&subjectId=...`) — unterschiedliche
  Endpunkte, unterschiedliche Response-Typen (`DeliveryAuthorizationDetailResponse`
  vs. `DocumentReference[]`). `DeliveryAuthorizationDetailPage.tsx` ruft beide
  unabhängig auf (zwei separate `useEffect`-Promises), das Fehlschlagen des
  Dokumenten-Aufrufs blockiert nicht die Anzeige der Kerndaten (verifiziert
  durch Test "zeigt die Kerndaten weiterhin an, wenn das (optionale)
  Dokumenten-Laden fehlschlägt (AC13)").
- **Austauschbarkeit demonstriert:** `StubDocumentProvider` ist explizit als
  Übergangslösung markiert; ein künftiger `D3CloudDocumentProvider` müsste
  laut Code-Struktur nur `DocumentProvider` implementieren und im
  DI-Provider von `DocumentsModule` ausgetauscht werden — keine Änderung an
  `DocumentsController`, `DeliveryAuthorizationsService` oder
  `delivery-authorizations` selbst wäre nötig.

**AC13: bestanden**, Trennung ist im Code tatsächlich vollzogen, nicht nur
in der ADR behauptet.

## Vertiefte Prüfung AC14 (Mandantentrennung, inkl. `/documents`-Lücke laut ADR 0009)

Dies war laut Aufgabenstellung der kritischste Einzelpunkt — die ADR
beschreibt explizit eine potenzielle Lücke, falls `DocumentsController` nur
an `DocumentProvider` delegieren würde, ohne eigene Ownership-Prüfung.

- **`delivery-authorizations`-Endpunkt:** `DeliveryAuthorizationsService.getMyDeliveryAuthorizationById`
  vergleicht `deliveryAuthorization.supplierId !== auth.supplierId` und
  liefert bei Mismatch `{ kind: 'forbidden' }`, der Controller mappt das auf
  `ForbiddenException` (403) **ohne** die Lieferberechtigungsdaten
  zurückzugeben. `auth.supplierId` stammt (wie bei `contracts`, ADR 0002)
  ausschließlich aus dem verifizierten Token, nie aus einem Client-Parameter.
  E2E-Test `delivery-authorizations.e2e-spec.ts` bestätigt genau dieses
  Verhalten mit echtem HTTP-Request und prüft zusätzlich, dass
  `response.body` kein `callOffNumber` enthält (keine Teildaten-Leckage).
- **`documents`-Endpunkt — die kritische zweite Prüfung:** Ich habe
  `DocumentsController.listDocuments` Zeile für Zeile gelesen (siehe oben,
  vollständiges Listing). Der Controller führt **tatsächlich** eine
  eigenständige, zusätzliche Ownership-Prüfung durch:
  ```ts
  const ownership = await this.deliveryAuthorizations.getMyDeliveryAuthorizationById(subjectId, auth);
  switch (ownership.kind) {
    case 'not_found': throw new NotFoundException();
    case 'forbidden': throw new ForbiddenException();
    case 'ok': break;
  }
  return this.documentProvider.listDocuments({ subjectType, subjectId });
  ```
  Diese Prüfung erfolgt **vor** dem Aufruf von `documentProvider.listDocuments(...)`
  — es handelt sich nicht um eine reine Delegation an den Provider. Da
  `StubDocumentProvider.listDocuments` für **jede** `subjectId`
  unterschiedslos `[]` liefert (verifiziert durch Lesen des Codes), wäre ohne
  diese zusätzliche Prüfung ein Zugriff auf eine fremde `subjectId` "zufällig
  erfolgreich" (200 `[]`) statt korrekt abgelehnt.
- **Test deckt exakt diese Lücke ab, nicht nur den Erfolgsfall:**
  `documents.e2e-spec.ts`, Test "KERN-GATE: GET /documents für die subjectId
  eines ANDEREN Lieferanten -> 403, NICHT die leere Liste des
  Stub-Providers" fragt gezielt eine `subjectId` ab, die einer anderen
  `supplierId` gehört (`delivery-authorization-synthetic-004`, Lieferant B),
  erwartet `403` **und** prüft explizit `expect(response.body).not.toEqual([])`
  — eine Assertion, die speziell den Unterschied zwischen "korrekt
  abgelehnt" und "zufällig leer, aber technisch durchgelassen" sichtbar
  macht. Zusätzlich wird der Positivfall (eigene `subjectId` → 200 `[]`) und
  der 404-Fall (unbekannte `subjectId`) separat getestet, sodass die drei
  Fälle (200/403/404) nicht verwechselbar sind.
- Kein `userType`- oder sonstiges Attribut wird für die Autorisierungsentscheidung
  herangezogen — ausschließlich `supplierId` (GPA), konsistent mit ADR 0008.

**AC14: bestanden, inklusive der von der ADR selbst als kritisch benannten
`/documents`-Erweiterung.** Dies ist der am gründlichsten test-abgesicherte
Teil der gesamten Story.

## Regressionsprüfung (bestehende Funktionalität)

- **Login-Flow:** `App.spec.tsx` (3 Tests: nicht angemeldet → Anmeldeseite
  statt Kontrakte; angemeldet → Kontrakte + Abmelden-Button; OIDC-Callback-
  Route unabhängig vom Anmeldestatus) läuft unverändert grün mit der neuen
  `react-router-dom`-basierten `App.tsx`. `ProtectedArea.spec.tsx` (5 Tests:
  Ladezustand, Redirect zur Anmeldeseite, Fehlerzustand mit Retry,
  authentifizierter Zugriff) ebenfalls unverändert grün.
- **`ContractsListPage`:** `ContractsListPage.spec.tsx` (4 Tests: Leer-Zustand,
  Pflichtspalten, abgelaufene Kontrakte, Veraltet-Hinweis) unverändert grün;
  `ContractsListPage` selbst wurde nicht auf das neue Design-System migriert
  (laut ADR 0009 "Konsequenzen" explizit **nicht** Teil dieser Story) — sie
  wird nun aber innerhalb der neuen `AppShell`/`Portal`-Struktur gerendert;
  der Test prüft weiterhin nur die Komponente isoliert, was für den
  Migrations-Nicht-Anspruch dieser Story korrekt ist.
- **`AUTH_CALLBACK_PATH`-Umstellung:** von manuellem
  `window.location.pathname`-Vergleich auf eine reguläre `<Route>` — Test
  "rendert den Callback-Screen auf der OIDC-Redirect-URI, unabhängig vom
  aktuellen Anmeldestatus" bestätigt, dass dieses Verhalten erhalten blieb.
- **`css-module-mock.cjs`-Fix:** Ich habe den vom Entwickler dokumentierten
  Bugfix (`__esModule` liefert jetzt explizit `undefined` statt
  fälschlich `"__esModule"`) im Test-Setup nachvollzogen; die Begründung
  (TypeScripts `esModuleInterop`/`__importDefault` erkannte den alten Mock
  fälschlich als bereits transpiliertes ESM-Modul) ist plausibel und wird
  durch das durchgängig grüne `AppShell.spec.tsx` (`toHaveClass(...)`)
  bestätigt. Kein bestehender Test wurde für diesen Fix verändert oder ist
  seitdem rot.

**Keine Regression gefunden.** Alle 8 bestehenden Web-Test-Suiten
(`App`, `AuthCallbackPage`, `LoginPage`, `LogoutButton`, `ProtectedArea`,
`ContractsListPage` + die neu hinzugekommenen) sind grün.

## Bewertung der "Offenen Fragen" aus dem Backlog

Geprüft, ob offene Fragen transparent als Annahme/Platzhalter markiert sind
(wie von der Story gefordert), statt stillschweigend implementiert zu werden:

| Offene Frage | Status im Code |
|---|---|
| Bedeutung von "Öffnen" (Detail vs. Dokument) | **Transparent entschieden und dokumentiert** (ADR 0009 Abschnitt 7: Navigation zu Detailseite, Dokumente zusätzlich/nicht-blockierend). Keine stillschweigende Annahme — als bewusste Architekturentscheidung mit Begründung im ADR und im Code-Kommentar von `DeliveryAuthorizationDetailPage.tsx` festgehalten. |
| Feldkatalog der Detailansicht über die 4 Pflichtfelder hinaus | **Transparent offen gelassen.** `DeliveryAuthorizationDetailPage.tsx` zeigt exakt die vier Pflichtfelder, mit explizitem Kommentar ("Fachlicher Inhalt ... ist laut Backlog ... nicht geklärt ... zeigt daher bewusst nur die bekannten Kernfelder"). Keine erfundenen Zusatzfelder gefunden. |
| Sinnvoller Standardzeitraum | **Transparent als PLATZHALTER markiert.** `date-range-default.ts` trägt einen mehrzeiligen Kommentar, der den Wert ("heute" bis "+30 Tage") ausdrücklich als *keine* fachliche Festlegung kennzeichnet. |
| Umgang mit abgelaufenen Lieferberechtigungen | **Nicht implementiert, korrekt nicht spekuliert.** Kein Ausblend-/Archivierungsmechanismus im Code — konsistent mit "offen". |
| Technische Absicherung der Mandantentrennung | **Beantwortet durch die Implementierung selbst** (serverseitig, Repository-Filter + zusätzlicher Ownership-Check bei `/documents`, siehe AC14-Vertiefung) — keine rein UI-seitige Filterung, keine spekulative Zusatz-Doku nötig. |
| D3-Cloud-Schnittstellenvertrag | **Transparent offen, bewusst nicht spekuliert.** `document.types.ts`/`stub-document.provider.ts` markieren das Feld-Set von `DocumentReference` explizit als unvollständig/unbekannt. |
| Sammel-Dokument vs. mehrere Einzelansichten | **Transparent entschieden** (untereinander gerenderte Einzel-Detailseiten, `DeliveryAuthorizationsOpenPage.tsx`, mit Kommentar zur offengelassenen ADR-Frage). |
| Audit-Log für Lesezugriffe | **Nicht implementiert, korrekt als offen benannt** — kein Logging-Code vorhanden (siehe DSGVO-Prüfpunkte). |
| Sync-/Datenstand-Hinweis | **Transparent als Platzhalter markiert.** `PLACEHOLDER_SYNC_META` in `delivery-authorizations.controller.ts` mit TODO-Kommentar, analog zur bestehenden Lücke bei Kontrakten. |

**Bewertung: Alle offenen Fragen sind entweder explizit als Annahme/Platzhalter
im Code kommentiert oder bewusst nicht implementiert und im Backlog/ADR als
offen benannt — keine stillschweigenden fachlichen Festlegungen gefunden.**
Das erfüllt die von der Story selbst geforderte Transparenzpflicht.

## DSGVO-Prüfpunkte

- **Zugriffskontrolle je Lieferant (Mandantentrennung):** Bestanden, sowohl
  für `delivery-authorizations` als auch — mit expliziter zweiter Prüfung —
  für `documents` (siehe vertiefte AC14-Prüfung oben). `supplierId` stammt in
  beiden Modulen ausschließlich aus dem verifizierten Auth-Kontext, nie aus
  Client-Parametern.
- **Kein Klartext-Logging:** Verifiziert per gezieltem Grep
  (`console.*`/`Logger`) über `apps/api/src/delivery-authorizations`,
  `apps/api/src/documents`, `apps/web/src/delivery-authorizations`,
  `apps/web/src/design-system`: **keine Treffer.** Kein Logging-Code
  vorhanden, der versehentlich Lieferberechtigungs- oder Dokumentdaten in
  Klartext ausgeben könnte. Das ist aktuell weder verletzt noch aktiv
  abgesichert (Blindfleck analog zur `lieferanten-anmeldung-gpa`-Bewertung):
  Sobald ein Audit-Log für Lesezugriffe eingeführt wird (laut Backlog selbst
  offene Frage), muss sichergestellt werden, dass keine `callOffNumber`/
  `supplierId`/Dokumentnamen unkontrolliert in Logs landen.
  Fachlich relevant: laut Domain-Glossar sind Lieferberechtigungen nur
  "Teilweise" DSGVO-sensibel, Belege/Dokumente "Abhängig vom Typ" — der
  aktuelle `StubDocumentProvider` liefert ohnehin keine echten Dokumentdaten.
- **Synthetische Testdaten:** Bestanden, vollständig geprüft. Alle Fixtures
  (`in-memory-delivery-authorization.repository.ts`:
  `supplier-synthetic-a`/`-b`, `SYNTH-ABRUF-*`, `Testsorte A/B/C`;
  `delivery-authorizations.service.spec.ts`: `SUPPLIER_A`/`SUPPLIER_B`,
  `SYNTH-TEST-*`; alle `.spec.tsx`-Dateien: `synthetic-access-token`,
  `delivery-authorization-synthetic-*`) sind klar erkennbar synthetisch.
  Zusätzlicher Grep nach realistisch wirkenden Mustern (Steuerbescheid/
  Prämie/Gutschrift-Begriffen, E-Mail-Adressen, langen Ziffernfolgen) über
  alle neuen Quell-/Testdateien: **keine Treffer.**
- **Aufbewahrung/Löschung:** Nicht anwendbar für den heutigen Code-Stand — es
  gibt keine eigene Persistenz (In-Memory-Übergangslösung, keine DB-/ORM-
  Entscheidung getroffen) und keine gespeicherten Dokumentdaten
  (`StubDocumentProvider` liefert immer `[]`). Sobald eine echte Persistenz
  bzw. eine reale D3-Cloud-Anbindung existiert, ist dieser Punkt erneut zu
  bewerten — aktuell korrekt als "n/a mangels Datenhaltung" einzustufen, kein
  Versäumnis dieser Story.
- **`Beleg`/Dokument-Klassifizierung:** ADR 0009 hält zutreffend fest, dass
  die "Abhängig vom Typ"-Klassifizierung erst bei realer D3-Cloud-Anbindung
  wiederholt werden muss — der aktuelle Stub überträgt keine personenbezogenen
  Daten. Korrekt als vorläufig markiert, keine verfrühte Festlegung.

## Befunde / Bugs

1. **Gering, kein Blocker (AC17-Randfall):** Fehler beim optionalen
   Dokumenten-Laden in `DeliveryAuthorizationDetailPage.tsx` werden
   stillschweigend verschluckt (kein sichtbarer Hinweis an den Lieferanten,
   dass Dokumente evtl. nicht geladen werden konnten). Das ist für den
   heutigen `StubDocumentProvider` (liefert ohnehin immer `[]`, "kein
   Dokument" und "Fehler beim Laden" sehen für den Nutzer identisch aus)
   praktisch folgenlos, weicht aber vom Wortlaut von AC17 ab, sobald eine
   echte D3-Cloud-Anbindung existiert und Fehler dort tatsächlich häufiger
   auftreten können (z. B. "D3 Cloud nicht erreichbar"). Empfehlung: bei
   Einführung der echten D3-Cloud-Anbindung einen sichtbaren, nicht
   blockierenden Hinweis ("Dokumente konnten nicht geladen werden") statt
   des heutigen stillen Verschluckens ergänzen.
2. **Gering, kein Blocker (AC2/AC18-Randfall):** Kein automatisierter Test
   simuliert tatsächlich einen schmalen Viewport; die responsive Eigenschaft
   (`overflow-x: auto`) ist nur durch Code-Review, nicht durch Test
   abgesichert. AC18 fordert diesen Test nicht explizit, daher keine
   AC-Verletzung, aber ein nachvollziehbarer Verbesserungspunkt für künftige
   Snapshot-/visuelle Regressionstests.
3. **Kein Scope-Verstoß gefunden:** `DocumentsController` verwendet
   tatsächlich einen eigenen, zusätzlichen Ownership-Check statt reiner
   Delegation an `DocumentProvider` — der von der ADR als kritisch benannte
   Angriffsvektor (fremde `subjectId` via `/documents`) ist nachweislich
   geschlossen und durch einen gezielten Test abgesichert, der explizit
   `not.toEqual([])` statt nur `expect(403)` prüft.
4. **Kein AC5/AC9-Regressionsrisiko gefunden:** Der Auswahl-Reset bei
   Zeitraum-Änderung ist eine bewusste, separate Code-Zeile
   (`setSelectedIds(new Set())`), kein Nebeneffekt einer anderen Änderung,
   und durch einen echten Interaktionstest (nicht nur Zustandsprüfung nach
   dem Laden) abgesichert.
5. **Positiv:** Alle im Backlog als "Offene Fragen" markierten Punkte sind im
   Code entweder klar als Platzhalter/Annahme kommentiert oder bewusst nicht
   implementiert — keine stillschweigenden fachlichen Festlegungen gefunden
   (siehe Tabelle oben).
6. **Blindfleck, keine Verletzung (DSGVO):** Kein Audit-Logging für
   Lesezugriffe vorhanden — laut Backlog selbst offene Frage, vor
   Produktivbetrieb mit echten Lieferantendaten zu klären (Security-
   Zuständigkeit).
7. **Bestehende, nicht durch diese Story verursachte Lücke (Konsistenz-Hinweis,
   kein neuer Bug):** `apps/web` importiert Typen weiterhin direkt aus
   `../../../api/src/...` (`delivery-authorization.types.ts`,
   `document.types.ts`) statt aus einem geteilten Package — dieses Muster
   existierte bereits bei `ContractsListPage.tsx` vor dieser Story und wird
   hier konsistent fortgesetzt, keine neue Abweichung. Sollte bei einer
   künftigen Monorepo-Strukturbereinigung berücksichtigt werden.

## Freigabe-Status

**Freigegeben** — alle 18 Akzeptanzkriterien sind durch tatsächlichen,
gelesenen Code und durch echte (nicht nur behauptete) automatisierte Tests
abgedeckt; `npm run typecheck --workspaces` und `npm test --workspaces` sind
beide grün; keine Regression im bestehenden Login-Flow oder der
Kontrakte-Seite; alle Test-Fixtures sind ausschließlich synthetisch; die
laut ADR 0009 kritischste Mandantentrennungs-Lücke (`/documents`-Endpunkt
ohne eigene Ownership-Prüfung) ist nachweislich geschlossen und gezielt
getestet.

Begründung im Detail:

- **Vollständig bestanden, code- und testabgedeckt:** AC1, AC3, AC4 (im
  Rahmen des transparent markierten Platzhalter-Standardzeitraums), AC5,
  AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14 (inkl. der erweiterten
  `/documents`-Prüfung), AC15, AC16, AC18.
- **Bestanden mit dokumentierter Einschränkung:** AC2 (CSS-Lösung korrekt
  umgesetzt, aber kein automatisierter Viewport-Test — kein AC-Verstoß, da
  AC2 keinen spezifischen Test verlangt); AC17 (Kernpfad Liste/Detail
  vollständig abgedeckt, Dokumenten-Teilpfad verschluckt Fehler
  stillschweigend — siehe Befund 1, aktuell folgenlos wegen `StubDocumentProvider`,
  aber vor einer echten D3-Cloud-Anbindung nachzubessern).
- **Keine blockierenden Befunde.** Die zwei identifizierten Befunde (1 und 2)
  sind geringfügig, betreffen keinen der 18 Akzeptanzkriterien in einer Weise,
  die den heutigen Funktionsumfang der Story unbenutzbar oder unsicher macht,
  und sind beide nachvollziehbar auf die bewusst offen gelassene D3-Cloud-
  Anbindung bzw. auf fehlende (nicht geforderte) visuelle Regressionstests
  zurückzuführen.

Auflage für künftige Folgearbeit (kein Freigabe-Hindernis für den heutigen
Scope): Vor Anbindung der echten D3-Cloud-API ist Befund 1 (stillschweigend
verschluckte Dokumenten-Ladefehler) zu beheben, und ein Audit-Log-Konzept für
Lesezugriffe auf Lieferberechtigungen/Dokumente ist vor Produktivbetrieb mit
echten Lieferantendaten zu klären (Security-Zuständigkeit, analog zur
entsprechenden offenen Frage bei Kontrakten).
