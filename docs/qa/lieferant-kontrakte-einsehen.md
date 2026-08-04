# QA-Bericht: Lieferant kann seine Kontrakte in der Extranet-Weboberfläche einsehen

## Vorbemerkung zum Prüfstand

Es existiert **keine lauffähige Implementierung**. Geprüft wurden ausschließlich
folgende Artefakte per Code-Review (kein Build, kein Testlauf möglich):

- `apps/api/src/contracts/contract.types.ts`
- `apps/api/src/contracts/contract-repository.interface.ts`
- `apps/api/src/contracts/contracts.service.ts`
- `apps/web/src/contracts/ContractsListPage.tsx`

Es gibt kein `package.json`, kein NestJS- oder React-Projekt, keinen HTTP-Server,
keine Datenbank/Persistenz, keinen Ingestion-Adapter Lobster → `apps/api`, keinen
Auth-/Session-Mechanismus und **keine automatisierten Tests** irgendeiner Art im
Repository (verifiziert per Dateisuche über `apps/*`). Ich habe damit **keine
Testläufe durchgeführt** und erfinde keine Ergebnisse — die folgende Tabelle ist
ein **Testplan** für die Sollzustände; der Spalte "Status" ist zu entnehmen, was
davon aktuell überhaupt per Code-Review beurteilbar war und was mangels
Implementierung nicht geprüft werden kann.

## Testfälle

| ID | Szenario | Erwartetes Ergebnis | Status |
|---|---|---|---|
| TC-01 | Happy Path Liste (AC1, AC2): Lieferant eingeloggt, ruft Menüpunkt "Kontrakte" auf | Liste eigener Kontrakte mit Kontraktnummer, Artikel/Warengruppe, Menge, Gültigkeitszeitraum, Status | Nicht prüfbar — kein Menüpunkt/Routing, kein HTTP-Endpunkt `GET /contracts`, kein Server. `ContractsListPage.tsx` rendert die Pflichtspalten korrekt gemäß Code-Review, ist aber mangels React-Projekt nicht kompilierbar/ausführbar. |
| TC-02 | Detailansicht (AC3): Kontrakt aus Liste öffnen | Alle Preis-/Mengenkonditionen (`conditions[]`) des Kontrakts werden angezeigt | Nicht prüfbar / **Lücke** — es existiert keine Detail-Komponente in `apps/web`; `getMyContractById` in `contracts.service.ts` liefert die Rohdaten, aber kein Controller/Route bindet dies an. AC3 ist serverseitig auf Logikebene vorbereitet, clientseitig nicht umgesetzt. |
| TC-03 | Mandantentrennung Liste (AC4): Lieferant A ruft `GET /contracts` auf | Nur Kontrakte mit `supplierId == auth.supplierId` werden geliefert | Nicht end-to-end prüfbar — `findManyForSupplier(supplierId)` ist nur ein Interface ohne Implementierung, keine DB. Auf Code-Ebene ist das Muster korrekt (Service liest `supplierId` ausschließlich aus `AuthenticatedSupplierContext`, `contracts.service.ts:44-46`). |
| TC-04 | Mandantentrennung Detail via ID-Manipulation (AC4): Lieferant ruft fremde `contractId` auf | Serverseitige Ablehnung mit 403, keine Kontraktdaten im Response | Logik im Konturwurf korrekt: `contracts.service.ts:67-69` vergleicht `contract.supplierId !== auth.supplierId` und gibt bei Mismatch `{ kind: 'forbidden' }` **ohne** Kontraktdaten zurück. **Nicht end-to-end prüfbar**, da kein Controller/Guard existiert, der diesen Rückgabewert tatsächlich in HTTP 403 übersetzt, und `apps/web` laut Implementierungsnotiz explizit **keine** 403-Fehlerbehandlung besitzt. |
| TC-05 | Zugriff auf nicht existierende `contractId` | HTTP 404 | Logik korrekt vorbereitet (`contracts.service.ts:63-65`, `kind: 'not_found'`), aber nicht end-to-end prüfbar (kein Controller). |
| TC-06 | Informationsleck 403 vs. 404 (Security-Review-relevant) | Bewusster Trade-off laut ADR 0002 ("Konsequenzen"): Existenz einer Kontrakt-ID ist über wiederholtes Probing unterscheidbar, auch wenn Inhalte nie preisgegeben werden | Muss von Security/Product explizit abgenommen oder in Folge-ADR auf einheitliches 404 umgestellt werden, bevor produktiv gegangen wird. Nicht Gegenstand dieser Story allein zu entscheiden. |
| TC-07 | Leerer Zustand (AC5): Lieferant ohne Kontrakte ruft Liste auf | Klarer Hinweis "Keine Kontrakte vorhanden", kein leerer Bildschirm/Fehler | Code-Review positiv: `ContractsListPage.tsx:58-59` behandelt `contracts.length === 0` korrekt. **Nicht visuell/funktional verifizierbar**, da Komponente nicht baubar ist. |
| TC-08 | Stale-/Fehlgeschlagene Synchronisation (AC6) | Hinweis auf Zeitpunkt letzter erfolgreicher Sync, `isStale`-Kennzeichnung, keine stillschweigende Anzeige veralteter Daten | **Bug/Lücke gefunden**: `ContractsService.listMyContracts()` gibt nur `Contract[]` zurück (`contracts.service.ts:44-46`), nicht `ContractListResponse` mit `lastSuccessfulSyncAt`/`isStale`. Die Befüllung dieser Felder ist explizit als TODO im Code markiert (`contracts.service.ts:40-42`). Der in ADR 0001 Punkt 3 festgelegte Response-Vertrag ist damit aktuell **nicht erfüllt**, selbst auf reiner Logikebene. UI-Teil (`ContractsListPage.tsx:49-55`) ist korrekt vorbereitet, bekäme aber nie befüllte Daten. |
| TC-09 | Fehlende/abgelaufene Session (AC7): nicht eingeloggter Zugriff auf Liste/Detail | Redirect zur Anmeldeseite, keine Kontraktdaten werden ausgeliefert | **Explizit nicht implementiert** (siehe Implementierungsnotiz). Kein Auth-Mechanismus, keine Middleware, kein Guard. Dies ist der kritischste offene Punkt, da er direkt Zugriffsschutz auf sensible Daten betrifft. |
| TC-10 | Kennzeichnung abgelaufener Kontrakte (AC8) | Abgelaufene Kontrakte optisch/inhaltlich eindeutig von aktiven unterscheidbar | **Bug/Lücke gefunden**: Es gibt keine Ableitungslogik für `Contract.status` (`'active'`/`'expired'`) aus `validTo` vs. aktuellem Datum — laut `contract.types.ts:133-138` explizit als TODO markiert. Ohne diese Logik erhält `status` nie zuverlässig `'expired'`, wodurch die an sich korrekt umgesetzte UI-Kennzeichnung (`ContractsListPage.tsx:85,91,99`) faktisch nie greift. AC8 ist damit nicht erfüllbar, obwohl der UI-Teil isoliert betrachtet richtig aussieht. |
| TC-11 | Edge Case: `validTo` == heutiges Datum | Verhalten (aktiv oder abgelaufen an genau diesem Tag) ist fachlich zu klären | Nicht spezifiziert — weder Backlog noch ADR 0001 legen die Grenzwert-Semantik fest. Muss vor Implementierung der Statusableitung geklärt werden. |
| TC-12 | Edge Case: `IncomingContractRecord.status` vom ERP vorhanden vs. fehlend | Definierte Vorrangregel ERP-Status vs. lokal berechneter Status | Nicht testbar — kein Ingestion-Adapter/Mapping vorhanden (ADR 0001 Punkt 4 explizit offen). |
| TC-13 | Edge Case: Kontrakt mit leerem `conditions[]` in Detailansicht | Definiertes Verhalten (z. B. "keine Konditionen hinterlegt" statt leerer Tabelle) | Nicht spezifiziert, nicht implementiert. |
| TC-14 | Fehlerfall: `ContractRepository`-Zugriff schlägt technisch fehl (z. B. DB nicht erreichbar) | Definierter Fehlerpfad, keine ungefilterte Exception mit sensiblen Daten an Client | Nicht testbar — keine Persistenzimplementierung, kein Error-Handling-Konzept vorhanden. |
| TC-15 | Mehrere Kontrakte, gemischt aktiv/abgelaufen, Sortierung/Reihenfolge in der Liste | Fachlich sinnvolle, konsistente Reihenfolge | Nicht spezifiziert (weder Backlog noch Code legen Sortierkriterium fest). |

## DSGVO-Prüfpunkte

Kontrakt-Daten sind laut Backlog/ADR 0001/ADR 0002 explizit als
kommerziell/finanziell sensibel eingestuft (Preis-/Mengenkonditionen,
Liefermengen). Folgende Punkte wurden geprüft bzw. als offen identifiziert:

- **Zugriffskontrolle je Lieferant (Mandantentrennung):** Auf reiner
  Service-Logik-Ebene korrekt entworfen (`supplierId` ausschließlich aus
  verifiziertem Auth-Kontext, nie aus Client-Input; Defense-in-Depth über
  Repository-Filter laut ADR 0002 Punkt 1/3). **Aber:** Es gibt keinen Guard,
  keinen Controller und keine Auth-Middleware, die `AuthenticatedSupplierContext`
  tatsächlich befüllt — die Kontrolle existiert nur als Absicht, nicht als
  durchsetzbarer Mechanismus. **Nicht abnahmefähig.**
- **403-vs-404-Unterschied als Informationsleck:** ADR 0002 benennt dies selbst
  als bewussten, aber prüfungswürdigen Trade-off (Existenz einer Kontrakt-ID wird
  über Statuscode unterscheidbar). Muss von Security/Product explizit
  abgenommen werden, siehe TC-06.
- **Kein Klartext-Logging sensibler Felder:** Nicht überprüfbar, da im gesamten
  Konturwurf **keinerlei Logging-Code** existiert (weder korrekt noch fehlerhaft).
  Das ist kein Bestandener-Befund, sondern ein Blindfleck: Sobald eine echte
  Implementierung entsteht (Controller, Fehlerbehandlung, Ingestion-Adapter),
  muss explizit sichergestellt werden, dass Preis-/Mengenkonditionen und andere
  sensible Kontraktfelder nicht in Logs, Fehlermeldungen oder Stacktraces im
  Klartext landen. Dies gehört als Kriterium in die Definition of Done der
  echten Implementierung.
- **Aufbewahrung/Löschung:** Weder Backlog noch ADRs treffen eine Aussage zur
  Aufbewahrungsdauer oder Löschung von Kontraktdaten nach Vertragsende/Ablauf.
  Das Backlog benennt dies selbst als offene Frage ("Wie ist der Umgang mit
  historischen/abgelaufenen Kontrakten geregelt?"). **Ungeklärt, muss vor
  Produktivsetzung entschieden werden** (Löschkonzept, Archivierungsfrist,
  Bezug zu ERP als führendem System).
- **Audit-Log für Lesezugriffe:** Vom Backlog selbst als offene Frage markiert
  ("Wird ... ein Audit-Log für Lesezugriffe auf Kontrakte benötigt?"). Aktuell
  nicht umgesetzt, keine Entscheidung dokumentiert.
- **Datensparsamkeit im Datenkontrakt:** ADR 0001 lässt den vollständigen
  Feldkatalog für `conditions[]` bewusst offen ("Offene Annahmen"). Es ist noch
  nicht geklärt, ob alle ERP-Felder unreflektiert ins Extranet übertragen werden
  dürfen oder ob eine Positivliste freigegebener Felder nötig ist (Backlog,
  "Offene Fragen": "gibt es Felder, die aus Vertraulichkeitsgründen bewusst
  NICHT angezeigt werden dürfen?"). Solange das offen ist, kann eine
  DSGVO-/Vertraulichkeitsprüfung des tatsächlichen Feldumfangs nicht
  abgeschlossen werden.

## Befunde / Bugs

1. **Blocker — keine lauffähige Anwendung.** Es gibt kein `package.json`, kein
   Framework-Setup, keine Persistenz, keinen Ingestion-Adapter und keinen
   Auth-Mechanismus. Kein Akzeptanzkriterium kann end-to-end verifiziert werden.
2. **Blocker (AC7) — Zugriffsschutz nicht umgesetzt.** Ohne Auth-Mechanismus ist
   nicht sichergestellt, dass nicht eingeloggte Nutzer zur Anmeldeseite
   umgeleitet werden und keine Kontraktdaten erhalten. Dies betrifft direkt den
   Schutz sensibler Daten.
3. **Blocker (AC4) — 403-Pfad nicht end-to-end vorhanden.** Die Ownership-Logik
   in `contracts.service.ts` ist korrekt, aber ohne Controller/Guard/Route und
   ohne 403-Fehlerbehandlung in `apps/web` (laut Implementierungsnotiz explizit
   fehlend) ist Mandantentrennung nicht durchsetzbar.
4. **Bug/Lücke (AC6) — Sync-Metadaten werden nicht geliefert.**
   `ContractsService.listMyContracts()` gibt `Contract[]` statt
   `ContractListResponse` zurück; `lastSuccessfulSyncAt`/`isStale` sind laut
   Code-Kommentar (TODO) nicht implementiert. Der in ADR 0001 Punkt 3
   festgelegte Vertrag ist nicht erfüllt.
5. **Bug/Lücke (AC8) — keine Statusableitung.** Es fehlt die Logik, die
   `Contract.status` aus `validTo` vs. aktuellem Datum ableitet (als TODO in
   `contract.types.ts` markiert). Ohne sie bleibt die ansonsten korrekt gebaute
   UI-Kennzeichnung für abgelaufene Kontrakte wirkungslos.
6. **Lücke (AC1, AC3) — Web-Seite unvollständig.** Kein Routing/Menüpunkt
   (AC1), keine Detailansicht (AC3) in `apps/web`.
7. **Offener Sicherheits-Trade-off (ADR 0002).** 403-vs-404-Unterscheidung als
   mögliches Informationsleck über Existenz von Kontrakt-IDs — noch nicht von
   Security/Product final abgenommen.
8. **Offene DSGVO-Fragen ungeklärt.** Aufbewahrung/Löschung, Audit-Logging und
   vollständiger freigegebener Feldkatalog für Kontraktkonditionen sind laut
   Backlog selbst noch offene Fragen und daher nicht geprüft/erfüllt.
9. **Positiv festgehalten (Code-Review, nicht ausführbar getestet):** Die
   Kernideen aus ADR 0002 (Tenant-ID nur aus Auth-Kontext, kein Vertrauen auf
   Client-Input, Trennung Existenz- vs. Ownership-Prüfung, keine Datenrückgabe
   im Forbidden-Fall) sind in `contracts.service.ts` sauber und konsistent zur
   ADR umgesetzt. Ebenso sind Leer-Zustand (AC5) und die Grundstruktur der
   Pflichtspalten (AC2) in `ContractsListPage.tsx` korrekt skizziert.

## Freigabe-Status

**Blockiert.**

Begründung: Es existiert keine lauffähige Implementierung (kein Server, keine
Persistenz, kein Auth-Mechanismus, kein Web-Build) — laut ausdrücklicher
Implementierungsnotiz im Backlog handelt es sich bewusst um einen nicht
lauffähigen Konturwurf. Damit können weder Happy-Path- noch Fehler- noch
Edge-Case-Szenarien tatsächlich ausgeführt werden, und die sicherheitskritischen
Anforderungen AC4 (serverseitige Mandantentrennung) und AC7 (Session-Schutz)
sind nicht durchsetzbar geprüft. Zusätzlich bestehen bereits auf Code-Ebene
erkennbare funktionale Lücken für AC6 (fehlende Sync-Metadaten im
Service-Rückgabewert) und AC8 (fehlende Statusableitungslogik), die vor einer
Freigabe unabhängig vom Framework-Setup behoben werden müssen. Eine echte
Freigabe ist erst nach einer lauffähigen Implementierung (Framework, Persistenz,
Auth, Ingestion-Adapter) mit automatisierten Tests und einem erneuten,
end-to-end durchführbaren QA-Durchlauf möglich.
