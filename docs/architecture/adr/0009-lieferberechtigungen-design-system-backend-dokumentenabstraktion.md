# 9. Lieferberechtigungen: Web-Design-System, Routing, Backend-Domäne und Dokumenten-Service-Abstraktion

## Status
Vorgeschlagen

## Kontext

Die Backlog-Story
[`lieferberechtigungen-anzeigen`](../../backlog/lieferberechtigungen-anzeigen.md)
verlangt eine reine Leseansicht der Lieferberechtigungen (`DeliveryAuthorization`)
eines Lieferanten in `apps/web` (Mobile ist explizit eine spätere
Folge-Story). Sie ist damit das **erste Feature**, das über die bisher
einzige echte UI-Komponente (`LoginPage`, reine CSS-Module ohne geteiltes
System) hinausgeht und eine Liste mit Zeitraum-Filter, Mehrfachauswahl,
"Alle markieren" und Einzel-/Sammel-"Öffnen" benötigt — fachlich vergleichbar
mit Kontrakten (ADR 0001/ADR 0002), aber mit eigenen Anforderungen
(zusätzliche Dokumenten-Anbindung, Zeitraum-Filter, Mehrfachauswahl).

Fachliche Referenz ist ausschließlich `Design/Lieferberechtigungen.png`
(Funktionen: Zeitraum-Filter Datum von/bis, Tabelle Abrufnummer/Lieferdatum/
Uhrzeit/Sorte, Checkbox-Spalte, "Alle markieren", "Öffnen" je Zeile,
Sammel-Öffnen-Aktion, Export). Die visuelle Referenz ist ausschließlich
`Design/APP.png` (`Design/DESIGN`): helles Grau als Seitenhintergrund, weiße
Cards mit abgerundeten Ecken und dezentem Schatten, grüner Marken-Akzent,
klare serifenlose Typografie, Info-Card- und Listen-Card-Muster. Die dort
gezeigte mobile Bottom-Tab-Navigation ist ausdrücklich **keine** Vorlage für
`apps/web` — für Web wird eine eigenständige, aber stilistisch konsistente
Navigationsstruktur benötigt (AC3: "über dieselbe Navigationsstruktur
erreichbar wie andere Portalbereiche, z. B. Kontrakte").

Lieferberechtigungen stammen — analog zu Kontrakten — aus dem ERP-System via
Lobster (Systemgrenze, Domain-Glossar) und sind laut Glossar "Teilweise"
DSGVO-sensibel sowie immer lieferantenscharf über die GPA (ADR 0008). Die
Story fordert zusätzlich, dass eine künftige Dokumentenanzeige (AC13) über
eine **separate, austauschbare** Service-Schnittstelle erfolgt (Platzhalter
für eine künftige "D3 Cloud"-API), nicht hart mit der ERP-Lieferberechtigungs-
Abfrage verdrahtet.

Diese ADR knüpft an ADR 0001/0002/0008 an, ohne sie zu ändern: Das dort
etablierte Muster (eigene Extranet-Persistenz in `apps/api`, Guard +
Repository-Filter-Mandantentrennung über die verifizierte `supplierId`
== GPA) wird für eine neue Domäne (`DeliveryAuthorization`) sowie erstmals
für ein geteiltes Frontend-Baustein-Set und ein Dokumenten-Abstraktionsmodul
angewendet bzw. erweitert.

## Entscheidung

### 1. Kein externes UI-Kit — internes Mini-Design-System für `apps/web`

Es wird **keine** externe Komponentenbibliothek (z. B. MUI, Chakra, Ant
Design) eingeführt. Stattdessen: zentrale CSS-Custom-Property-Tokens plus
eine kleine Menge generischer, selbst geschriebener React-Komponenten mit
CSS Modules — konsistent mit dem bisherigen, einzigen UI-Präzedenzfall
(`LoginPage.module.css`) und mit dem im Projekt etablierten
Minimalismus-Prinzip (vgl. ADR 0007: kein Turborepo/Nx mangels aktuellem
Bedarf).

Begründung: Der aktuelle UI-Bedarf (Cards, eine generische Tabelle mit
Checkbox-/Aktionsspalte, ein Datums-Zeitraum-Filter, eine einfache
Navigationsleiste) ist mit Bordmitteln ohne nennenswerten Mehraufwand
abbildbar. Eine externe Bibliothek würde zusätzliches Theming-Overriding
erfordern, um dem spezifischen Look aus `APP.png` (helles Grau, weiße Cards,
grüner Marken-Akzent) zu entsprechen, und eine zusätzliche, projektweite
Abhängigkeit mit eigenem Versions-/Breaking-Change-Risiko einführen, ohne
dass der heutige Funktionsumfang das rechtfertigt. Sollte der
UI-Funktionsumfang künftig deutlich wachsen (z. B. viele Formular-/
Interaktionswidgets mit hohem A11y-Aufwand), ist eine erneute Prüfung in
einer eigenen Folge-ADR sinnvoll — hier bewusst **keine** Entscheidung auf
Vorrat.

Konkret werden angelegt (Sketch, keine vollständige Implementierung):

- `apps/web/src/design-system/tokens.css` — global eingebundene
  CSS-Custom-Properties:
  ```css
  :root {
    --color-background: #f2f3f5;   /* Seitenhintergrund, helles Grau */
    --color-surface: #ffffff;      /* Card-Hintergrund */
    --color-brand: #4f8a3d;        /* Marken-/Ökolabel-Grün (Platzhalter,
                                       siehe Offene Annahmen) */
    --color-text-primary: #1f2937;
    --color-text-secondary: #6b7280;
    --color-status-active: #2f7a3f;
    --color-status-expired: #9ca3af;
    --radius-card: 16px;
    --radius-control: 10px;
    --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.05);
    --space-1: 4px; --space-2: 8px; --space-3: 16px; --space-4: 24px; --space-5: 32px;
    --font-family-base: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
  ```
- `apps/web/src/design-system/Card.tsx` — generischer Container
  (`{ title?, actions?, children }`), rundet Ecken/Schatten gemäß Tokens.
- `apps/web/src/design-system/AppShell.tsx` — einfache, statische
  Navigationsleiste (`{ navigationItems: { label, to }[], children }`), löst
  AC3 (gleiche Navigationsstruktur wie Kontrakte). Bewusst **kein**
  dynamisches Menü-Konfigurationssystem — eine statische Liste genügt für
  den heutigen Funktionsumfang (Kontrakte, Lieferberechtigungen).
- `apps/web/src/design-system/DataTable.tsx` — siehe Punkt 4.
- `apps/web/src/design-system/DateRangeFilter.tsx` — siehe Punkt 5.

`apps/mobile` ist von dieser Entscheidung nicht betroffen (Story-Scope:
nur `apps/web`). Ob/wie sich Tokens auf React Native übertragen lassen (dort
kein CSS, sondern `StyleSheet`/Themable-Objekte), ist eine offene Frage für
die künftige Mobile-Folge-Story und wird hier nicht vorweggenommen.

### 2. Neu: `react-router-dom` als clientseitiges Routing für `apps/web`

`apps/web` besitzt aktuell kein Routing-Paket, sondern vergleicht in
`App.tsx` lediglich `window.location.pathname` gegen den festen
OIDC-Callback-Pfad. AC1/AC3 verlangen jedoch eine echte, mehrseitige
Navigationsstruktur (Kontrakte ↔ Lieferberechtigungen), und AC10 eine
Detailansicht mit Ressourcen-ID im Pfad (`/delivery-authorizations/:id`).
Das ist der Punkt, an dem das bisherige Pfad-String-Vergleichsmuster nicht
mehr sauber skaliert (mehrere Routen, Pfadparameter, ggf. Query-Parameter
für Sammel-Öffnen).

Es wird entschieden: **`react-router-dom` wird als minimale,
Industriestandard-Routing-Bibliothek für `apps/web` eingeführt** (kein
Eigenbau eines Mini-Routers, das wäre mehr Komplexität als die Nutzung der
Standardlösung). Skizze der Routen:

```
/                              -> Redirect auf /contracts (oder Portal-Startseite; Detail offen)
/contracts                     -> ContractsListPage (in AppShell)
/delivery-authorizations       -> DeliveryAuthorizationsListPage (in AppShell)
/delivery-authorizations/:id   -> DeliveryAuthorizationDetailPage
/delivery-authorizations/open  -> Sammel-Öffnen-Ansicht, IDs z. B. als
                                   Query-Parameter (?ids=a,b,c) -- exakte
                                   fachliche Ausgestaltung offen (siehe
                                   Entscheidung 7)
<AUTH_CALLBACK_PATH>           -> AuthCallbackPage (bestehender Pfad, künftig
                                   als reguläre Route statt manuellem Vergleich)
```

Diese Entscheidung betrifft ausschließlich `apps/web`. Für `apps/mobile`
ist Navigation (z. B. `expo-router`/`react-navigation`) nicht Teil dieser
ADR und wird mit der Mobile-Folge-Story separat entschieden.

### 3. Neue Backend-Domäne `delivery-authorizations` in `apps/api`

Analog zu ADR 0001 (Kontrakte) wird für Lieferberechtigungen ein eigenes
Modul `apps/api/src/delivery-authorizations/` angelegt, das strukturell dem
`contracts`-Modul folgt (Types, Repository-Interface + In-Memory-
Übergangslösung, Service, Controller, Module).

**Eingehender Datenkontrakt (Lobster/ERP → `apps/api`), Sketch:**

```ts
export interface IncomingDeliveryAuthorizationRecord {
  callOffNumber: string;   // Abrufnummer, fachlicher Schlüssel
  supplierGpa: string;     // GPA des Lieferanten (siehe Abweichung unten)
  deliveryDate: string;    // ISO-8601-Datum, Lieferdatum
  deliveryTime: string;    // "HH:mm", Uhrzeit
  variety: string;         // Sorte
}
```

**Bewusste Abweichung von ADR 0001:** Das Feld heißt `supplierGpa`, nicht
`supplierExternalId` (wie bei `IncomingContractRecord`). Begründung: Anders
als die Kontrakt-Domäne (ADR 0001, entstanden vor ADR 0008) wird die
`DeliveryAuthorization`-Domäne **nach** der GPA-Entscheidung (ADR 0008) neu
modelliert; das Backlog nennt Lieferberechtigungen bereits explizit als
"immer lieferantenscharf (GPA-Schlüssel)". Es wäre widersprüchlich, hier
erneut eine "alte ERP-Kennung" anzunehmen, die dann erst gemappt werden
müsste (das genau ist das in ADR 0008 als Risiko dokumentierte Problem bei
Kontrakten). Diese Entscheidung nimmt **nicht** vorweg, ob Lobster/SAP real
bereits die GPA für Lieferberechtigungs-Exporte liefert — das ist eine
unverifizierte, externe Systemgrenzen-Annahme (siehe "Offene Annahmen").

**Persistierte Entität und Antwortverträge, Sketch:**

```ts
export interface DeliveryAuthorization {
  id: string;                // lokale Extranet-ID
  supplierId: string;        // == GPA, aus AuthenticatedSupplierContext (ADR 0008)
  callOffNumber: string;
  deliveryDate: string;
  deliveryTime: string;
  variety: string;
}

export interface DeliveryAuthorizationSyncMeta {
  lastSuccessfulSyncAt: string | null;
  isStale: boolean;
}

export interface DeliveryAuthorizationListResponse extends DeliveryAuthorizationSyncMeta {
  items: DeliveryAuthorization[];
}

export interface DeliveryAuthorizationDetailResponse
  extends DeliveryAuthorization, DeliveryAuthorizationSyncMeta {}
```

Sync-Status wird analog ADR 0001 Punkt 3 als First-Class-Metadatum geführt
(`DeliveryAuthorizationSyncRun`, strukturell identisch zu `ContractSyncRun`),
primär für strukturelle Konsistenz zum etablierten Muster. Ob `apps/web`
diesen Datenstand-Hinweis für Lieferberechtigungen tatsächlich anzeigt, ist
laut Backlog ("Offene Fragen") ausdrücklich **nicht** entschieden — die API
stellt die Daten bereit, ihre Darstellung bleibt offen/optional.

**Endpunkte (Guard + Repository-Filter-Muster aus ADR 0002, unverändert
übernommen):**

- `GET /delivery-authorizations?from=<ISO-Datum>&to=<ISO-Datum>` — Liste
  "meiner" Lieferberechtigungen im Zeitraum. `from`/`to` sind **erforderliche**
  Query-Parameter (400 Bad Request bei Fehlen/Ungültigkeit) — die Berechnung
  eines "sinnvollen Standardzeitraums" (AC4) liegt bewusst in `apps/web`
  (siehe Entscheidung 6), nicht in `apps/api`, um Default-Logik nicht auf
  zwei Schichten zu duplizieren. `supplierId` kommt ausschließlich aus dem
  verifizierten Auth-Kontext (nie aus Query-Parametern), Repository filtert
  serverseitig (`findManyForSupplier(supplierId, { from, to })`).
- `GET /delivery-authorizations/:id` — Einzelzugriff, identisches
  404/403-Verhalten wie `GET /contracts/:contractId` (ADR 0002 Punkt 4):
  existiert nicht → 404; existiert, fremder Lieferant → 403 (Daten werden
  im 403-Fall nicht ausgeliefert); gehört mir → 200. Dieser Endpunkt bedient
  sowohl AC10 (einzelnes Öffnen) als auch — pro ausgewählter ID wiederholt
  aufgerufen — AC11 (Sammel-Öffnen, siehe Entscheidung 7).

Repository-Interface (Sketch, analog `ContractRepository`):

```ts
export interface DeliveryAuthorizationRepository {
  findManyForSupplier(
    supplierId: string,
    range: { from: string; to: string },
  ): Promise<DeliveryAuthorization[]>;
  findById(id: string): Promise<DeliveryAuthorization | null>; // ungefiltert, nur für 404/403-Zweistufenprüfung
}
```

Wie bei Kontrakten wird zunächst eine In-Memory-Übergangslösung mit
klar synthetischen Testdaten für mindestens zwei unterschiedliche
`supplierId`-Werte bereitgestellt (Mandantentrennungs-Fixtures), keine
echten Lieferantendaten (CLAUDE.md, "Sensible Daten"). Eine echte
Persistenz-/ORM-Entscheidung ist weiterhin nicht getroffen (unverändert
gültige Lücke aus ADR 0001).

### 4. Generische `DataTable`-Komponente (Interface-Sketch)

Damit die Tabelle nicht Lieferberechtigungs-spezifisch gebaut wird, sondern
für Kontrakte/Abnahmescheine wiederverwendbar bleibt:

```ts
export interface DataTableColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableSelectionProps {
  selectedIds: ReadonlySet<string>;
  onChange: (selectedIds: ReadonlySet<string>) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;         // AC15
  error?: string | null;       // AC17
  emptyState?: ReactNode;      // AC16
  selection?: DataTableSelectionProps;   // Checkbox-Spalte + "Alle markieren" (AC7/AC8)
  rowActions?: (row: T) => ReactNode;    // Aktionen-Spalte, z. B. "Öffnen"-Button (AC7/AC10)
}
```

**Architektur-Regel für Auswahl-State:** `DataTable` verwaltet die Auswahl
**nicht selbst** (fully controlled component) — die aufrufende Seite
(`DeliveryAuthorizationsListPage`) hält `selectedIds` im eigenen State.
Das löst AC5/AC9 sauber: Bei einer Zeitraum-Filter-Änderung setzt die Seite
`selectedIds` aktiv zurück (AC5), bei allen anderen Interaktionen bleibt der
State unverändert erhalten (AC9), ohne dass `DataTable` eigene, potenziell
mit der Seite widersprüchliche Logik dafür bräuchte. "Alle markieren"
(AC8) ist ausschließlich auf die aktuell sichtbaren `rows` bezogen (nicht
auf einen serverseitig größeren Bestand).

Responsives Verhalten (AC2): `DataTable` rendert die `<table>` innerhalb
eines horizontal scrollbaren Containers (`overflow-x: auto`), statt Spalten
auf schmalen Viewports auszublenden — keine Inhalte gehen verloren, keine
separate Mobile-Tabellenvariante nötig.

### 5. Generische `DateRangeFilter`-Komponente (Interface-Sketch)

```ts
export interface DateRangeValue {
  from: string; // ISO-8601-Datum
  to: string;
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  fromLabel?: string;
  toLabel?: string;
}
```

Ebenfalls bewusst generisch (kein `DeliveryAuthorizationDateFilter`), damit
künftige Listen mit Zeitraum-Filterung (z. B. Abnahmescheine) dieselbe
Komponente nutzen können.

### 6. Platzierung des "sinnvollen Standardzeitraums" (AC4)

Die Berechnung des initialen Standardzeitraums liegt in `apps/web`
(`DeliveryAuthorizationsListPage` setzt den initialen `DateRangeValue`,
bevor der erste Request an `GET /delivery-authorizations` erfolgt), nicht in
`apps/api`. `apps/api` verlangt `from`/`to` immer explizit als
Query-Parameter (siehe Entscheidung 3) und trifft keine eigene
Default-Entscheidung. Das ist eine reine Platzierungsentscheidung; der
**fachliche Wert** des Standardzeitraums selbst (laufender Monat? kommende
N Tage? letzte N Tage?) ist laut Backlog ("Offene Fragen") ausdrücklich
ungeklärt und wird hier **nicht** spekulativ festgelegt — Umsetzung beginnt
mit einem klar als vorläufig markierten Platzhalterwert, bis Product/
Fachseite den Wert festlegt.

### 7. "Öffnen"-Verhalten: Navigation statt Modal/Download

Es wird entschieden: "Öffnen" (einzeln, AC10) löst eine **clientseitige
Navigation** (react-router, siehe Entscheidung 2) zu einer Detailansicht
`/delivery-authorizations/:id` aus — kein Modal-Dialog, kein direkter
Datei-Download, kein neuer Browser-Tab. Diese Detailansicht lädt die
Lieferberechtigung über `GET /delivery-authorizations/:id` und **optional,
über die getrennte Dokumenten-Service-Schnittstelle** (Entscheidung 8)
zugehörige Dokumente nach.

Für das Sammel-Öffnen (AC11) wird **kein eigener Backend-Batch-Endpunkt**
eingeführt: `apps/web` navigiert zu einer Sammelansicht (Route-Sketch:
`/delivery-authorizations/open?ids=a,b,c`), die pro ID denselben
`GET /delivery-authorizations/:id`-Aufruf ausführt (inkl. identischem
404/403-Schutz je ID, das erfüllt AC14 auch für die Sammel-Aktion). Das ist
eine bewusst minimale Entscheidung (kein N+1-Problem-Workaround auf Vorrat);
sollte sich das bei großen Auswahlmengen als Performance-/Atomaritätsproblem
erweisen, ist eine dedizierte Batch-Endpunkt-ADR eine mögliche Folge-
Entscheidung, aber kein heutiger Bedarf.

**Ausdrücklich NICHT durch diese ADR entschieden** (bleibt offene fachliche
Frage laut Backlog): Was die Detailansicht inhaltlich zeigt (reine
Kernfelder vs. zusätzliche, heute noch unbekannte Attribute), und ob es für
das Sammel-Öffnen ein echtes "Sammel-Dokument" gibt oder mehrere
Einzelansichten nebeneinander dargestellt werden. Architektonisch ist nur
festgelegt: Navigation zu einer eigenen Ansicht, keine Direkt-Downloads,
Dokumente kommen ausschließlich über die getrennte Schnittstelle aus
Entscheidung 8.

### 8. Dokumenten-Service-Abstraktion (D3-Cloud-Platzhalter)

Für AC13 wird ein eigenständiges Modul `apps/api/src/documents/` angelegt,
**getrennt** vom `delivery-authorizations`-Modul, mit einem austauschbaren
Provider-Interface:

```ts
export type DocumentSubjectType = 'delivery-authorization'; // erweiterbar

export interface DocumentSubjectReference {
  subjectType: DocumentSubjectType;
  subjectId: string; // lokale Extranet-ID des fachlichen Objekts
}

export interface DocumentReference {
  id: string;
  name: string;
  // Weitere Felder (Typ, Größe, Download-Mechanismus) bewusst offen --
  // unbekannt, bis die reale D3-Cloud-API vorliegt (siehe Offene Annahmen).
}

export interface DocumentProvider {
  listDocuments(subject: DocumentSubjectReference): Promise<DocumentReference[]>;
}
```

Endpunkt-Sketch: `GET /documents?subjectType=delivery-authorization&subjectId=<id>`,
ebenfalls hinter `ZitadelAuthGuard`. **Wichtig für Mandantentrennung (AC14
erweitert auf Dokumente):** `DocumentsController` verifiziert vor dem
Aufruf von `DocumentProvider` zusätzlich die Eigentümerschaft des
referenzierten `subjectId`, indem er (für `subjectType ===
'delivery-authorization'`) denselben Ownership-Check wie
`GET /delivery-authorizations/:id` über `DeliveryAuthorizationsService`
durchführt (404/403 analog). Ohne diese zweite Prüfung könnte ein Lieferant
über direkte `subjectId`-Manipulation an der `/documents`-Grenze fremde
Dokument-Metadaten erfragen, auch wenn `DeliveryAuthorization` selbst
korrekt geschützt ist — das wäre eine Mandantentrennungs-Lücke an einer
zweiten Stelle.

Konkrete Implementierung zunächst als `StubDocumentProvider` (analog
`InMemoryContractRepository` als "ÜBERGANGSLÖSUNG" markiert), die aktuell
**immer eine leere Liste** liefert, injiziert über einen DI-Token
(`DOCUMENT_PROVIDER`, analog `CONTRACT_REPOSITORY`). Eine künftige
`D3CloudDocumentProvider`-Implementierung kann das Interface erfüllen, ohne
`DocumentsController`, `DeliveryAuthorizationsService` oder die
Kernlogik von `delivery-authorizations` zu ändern (erfüllt AC13 explizit).

**Keine Spekulation über D3-Cloud-Interna:** Authentifizierung gegenüber
D3 Cloud, Datenformat, Fehlerverhalten bei Nichterreichbarkeit sowie das
exakte Feld-Set von `DocumentReference` sind unbekannt und werden hier
nicht angenommen (siehe "Offene Annahmen"). Die einzige heute getroffene
Aussage ist die Abstraktionsgrenze selbst (Interface + Modul-Namespace).

Falls künftig weitere `subjectType`-Werte hinzukommen (Kontrakte,
Abnahmescheine), ist der heute direkt verdrahtete Ownership-Check
(`DocumentsController` → `DeliveryAuthorizationsService`) durch eine
generische Registry/Strategie zu ersetzen — bewusst nicht heute vorgezogen
(nur ein `subjectType` existiert aktuell), um keine Abstraktion auf Vorrat
zu bauen.

## Konsequenzen

- `apps/web` erhält eine neue, aber bewusst kleine Laufzeitabhängigkeit
  (`react-router-dom`); keine vollständige UI-Kit-Abhängigkeit.
- Der bestehende manuelle Pfadabgleich für den OIDC-Callback (`App.tsx`,
  `AUTH_CALLBACK_PATH`) muss auf eine reguläre `react-router`-Route
  umgestellt werden — Umsetzungsaufwand für den Developer-Agenten, keine
  neue Architekturentscheidung.
- `ContractsListPage` nutzt heute noch keine der neuen generischen
  Komponenten (`Card`, `DataTable`, `AppShell`). AC3 verlangt "optisch/
  strukturell konsistent mit dem neuen Design-System" nur für die neue
  Lieferberechtigungs-Seite; ob/wann die bestehende Kontrakte-Seite auf das
  neue System migriert wird, ist eine naheliegende, aber **nicht** durch
  diese Story geforderte Folgearbeit — wird hier als Konsequenz benannt,
  nicht als impliziter Scope-Zuwachs dieser ADR behandelt.
- Zwei neue `apps/api`-Module (`delivery-authorizations`, `documents`)
  entstehen mit derselben In-Memory-/Stub-Übergangscharakteristik wie
  `contracts` — keine echte Datenbank-/ORM-Entscheidung getroffen (weiterhin
  offene Lücke aus ADR 0001).
- Die Namensabweichung `supplierGpa` (statt `supplierExternalId`) an der
  Lobster-Grenze für Lieferberechtigungen bedeutet, dass es künftig **zwei
  unterschiedliche Konventionen** für eingehende Lieferanten-Schlüsselfelder
  gibt (Kontrakte: `supplierExternalId`, Lieferberechtigungen:
  `supplierGpa`). Das ist beabsichtigt (unterschiedlicher historischer
  Kontext, siehe Entscheidung 3), sollte aber Security/QA und dem
  Lobster-Integrationsverantwortlichen explizit transparent gemacht werden,
  um Verwechslungen zu vermeiden.
- Sammel-Öffnen über N Einzelaufrufe von `GET /delivery-authorizations/:id`
  statt eines Batch-Endpunkts erzeugt bei großen Auswahlmengen mehr
  HTTP-Overhead als eine Batch-Lösung — akzeptierter Trade-off zugunsten
  von Einfachheit und Wiederverwendung des bereits vorhandenen,
  ADR-0002-konformen Autorisierungspfads.
- Folgende, im Backlog als "Offene Fragen" markierte Punkte bleiben
  bewusst unentschieden und sind **nicht** Gegenstand dieser ADR: exakter
  fachlicher Wert des Standardzeitraums, vollständiger Feldkatalog über die
  vier Pflichtspalten hinaus, Umgang mit abgelaufenen Lieferberechtigungen,
  Sammel-Dokument vs. mehrere Einzeldokumente, Audit-Logging für
  Lesezugriffe, Synchronisationsintervall/Datenstand-Anzeige.

## Offene Annahmen

- Unverifiziert: Lobster/SAP liefert für Lieferberechtigungen tatsächlich
  direkt die GPA (`supplierGpa`) und nicht eine gesonderte, ältere
  ERP-interne Lieferantenkennung, die erst gemappt werden müsste. Muss vor
  Umsetzung eines Ingestion-Adapters mit dem Lobster-/Integrations-
  verantwortlichen verifiziert werden (analog zur offenen Annahme in ADR
  0001/ADR 0008 für Kontrakte).
- Konkreter Transportmechanismus Lobster → `apps/api` für
  Lieferberechtigungen ist unbekannt und nicht Gegenstand dieser ADR
  (analog ADR 0001 Punkt 4).
- Reale D3-Cloud-API (Authentifizierung, Datenformat, Fehlerverhalten bei
  Nichterreichbarkeit, vollständiges Feld-Set von `DocumentReference`) ist
  unbekannt; der `StubDocumentProvider` liefert daher aktuell ausschließlich
  eine leere Liste.
- Exakter fachlicher Wert des "sinnvollen Standardzeitraums" (AC4) ist
  ungeklärt; `apps/web` verwendet bis zur fachlichen Klärung einen klar als
  vorläufig markierten Platzhalterwert.
- Fachlicher Inhalt der Detailansicht (welche Felder über die vier
  Pflichtspalten hinaus) sowie ob Sammel-Öffnen ein Sammel-Dokument erzeugt,
  sind ungeklärt und nicht Teil dieser ADR.
- Ob abgelaufene Lieferberechtigungen dauerhaft oder befristet angezeigt
  werden, ist ungeklärt.
- Audit-Logging-Konzept für Lesezugriffe auf Lieferberechtigungen/Dokumente
  ist offen (analog zur entsprechenden offenen Frage bei Kontrakten).
- Die in den CSS-Tokens verwendeten konkreten Hex-Farbwerte sind aus der
  visuellen Analyse von `Design/APP.png` abgeleitete Näherungswerte, keine
  verifizierten Corporate-Design-Farbcodes — bei Verfügbarkeit eines echten
  Styleguides sind sie zu ersetzen.

## Datenklassifizierung

- **Lieferberechtigung** (`DeliveryAuthorization`): Teilweise DSGVO-sensibel
  laut Domain-Glossar. Betrifft Listen- und Detailfelder sowie die
  Zuordnung zur GPA.
- **Lieferant** (`Supplier`) / **GPA**: Ja, Stammdaten-/Identifikations-
  sensibel laut Domain-Glossar — trägt über `supplierId`/`supplierGpa` die
  Mandantentrennung dieser gesamten Domäne.
- **ERP-System**: Ja, laut Glossar Quelle vieler sensibler Daten (Herkunft
  der Lieferberechtigungsdaten, keine eigene gespeicherte Entität).
- **Beleg** (`Document`, D3-Cloud-Dokumente): laut Glossar "Abhängig vom
  Typ". Der aktuelle `StubDocumentProvider` liefert keine echten Dokumente
  (leere Liste) und überträgt daher aktuell keine personenbezogenen Daten;
  die Klassifizierung ist zwingend zu wiederholen, sobald eine reale
  D3-Cloud-Anbindung existiert und der tatsächliche Dokumenttyp bekannt ist.
- **Lobster** / **D3 Cloud**: n/a — beides Systemgrenzen, keine eigene
  Datenklassifizierung.
