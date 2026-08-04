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
