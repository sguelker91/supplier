# Lieferberechtigungen anzeigen

> **Hinweis zum Reifegrad:** Anders als bei
> [`lieferanten-anmeldung-gpa`](lieferanten-anmeldung-gpa.md) ist dieses
> Feature für seinen definierten Scope (`apps/web` + `apps/api`) **funktional
> vollständig umgesetzt**: Alle 18 Akzeptanzkriterien aus dem Backlog sind
> durch Code und automatisierte Tests abgedeckt, QA hat mit Status
> **"Freigegeben"** abgeschlossen, Security mit Status **"Freigegeben"** für
> den heutigen Scope (In-Memory-/Stub-Übergangslösung, keine reale
> D3-Cloud-/ERP-Anbindung). Die Funktion ist in der Entwicklungsumgebung mit
> synthetischen Testdaten nutzbar. Für einen echten Produktivbetrieb mit
> echten Lieferantendaten bestehen mehrere dokumentierte, nicht blockierende
> Einschränkungen — siehe "Bekannte Einschränkungen/offene Punkte" unten.

## Für Lieferanten

Als Lieferant können Sie im Extranet-Webportal Ihre eigenen
**Lieferberechtigungen** einsehen:

- Über die Portal-Navigation erreichen Sie die Seite "Lieferberechtigungen"
  genauso wie z. B. die Kontrakte-Übersicht.
- Ein **Zeitraum-Filter** (Datum von/bis) ist beim Öffnen der Seite bereits
  mit einem Vorschlagswert vorbelegt; Sie können den Zeitraum jederzeit
  ändern, die Liste aktualisiert sich automatisch.
- Die Tabelle zeigt zu jeder Lieferberechtigung mindestens Abrufnummer,
  Lieferdatum, Uhrzeit und Sorte.
- Sie können einzelne oder mehrere Zeilen per Checkbox markieren (auch "Alle
  markieren"/"Alle abwählen" für alle aktuell sichtbaren Zeilen). Ihre
  Auswahl bleibt erhalten, bis Sie sie aktiv ändern oder den Zeitraum
  wechseln.
- Über "Öffnen" je Zeile sehen Sie die Details einer einzelnen
  Lieferberechtigung; über eine Sammelaktion können Sie alle markierten
  Lieferberechtigungen gemeinsam öffnen (sie werden untereinander
  dargestellt).
- In der Detailansicht werden zusätzlich zugehörige Dokumente geladen — aktuell
  liefert diese Anbindung noch **keine echten Dokumente** (siehe
  Einschränkungen unten).
- Wenn Daten geladen werden, sehen Sie einen Ladehinweis; liegen für den
  gewählten Zeitraum keine Lieferberechtigungen vor, wird das verständlich
  angezeigt statt einer leeren Tabelle; bei Fehlern erhalten Sie eine klare
  Fehlermeldung.
- Sie sehen ausschließlich Ihre eigenen Lieferberechtigungen; ein Zugriff auf
  fremde Lieferberechtigungen (z. B. über manipulierte Links) wird
  serverseitig verweigert.
- Die Ansicht funktioniert sowohl auf Desktop- als auch auf schmaleren
  (Tablet-/Mobile-Browser-)Bildschirmen. **Eine eigenständige App-Ansicht in
  der mobilen App ist nicht Teil dieser Funktion** — dafür ist eine
  eigene Folge-Funktion vorgesehen.

Was diese Funktion **nicht** bietet: Bearbeiten, Anlegen oder Löschen von
Lieferberechtigungen, ein Export der Liste (z. B. als CSV/Excel) sowie eine
Verknüpfung mit Kontrakten, Abnahmescheinen oder Mengenmeldungen.

## Für Entwickler

Umsetzung gemäß
[ADR 0009](../architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md)
(Details dort, nicht dupliziert):

- **Design-System** (`apps/web/src/design-system/`): erstes geteiltes
  UI-Baustein-Set für `apps/web` (`tokens.css`, `Card`, `AppShell`,
  generisches `DataTable`, generisches `DateRangeFilter`) — kein externes
  UI-Kit, siehe ADR 0009 Abschnitt 1/4/5.
- **Routing** (`apps/web`): `react-router-dom` (v7) neu eingeführt, ersetzt
  den bisherigen manuellen Pfadvergleich für den OIDC-Callback; Routen u. a.
  `/contracts`, `/delivery-authorizations`, `/delivery-authorizations/:id`,
  `/delivery-authorizations/open` (ADR 0009 Abschnitt 2/7).
- **Backend-Domäne** `apps/api/src/delivery-authorizations/`: eigenes Modul
  analog zum bestehenden `contracts`-Modul (Types, Repository-Interface +
  In-Memory-Übergangslösung, Service, Controller). Mandantentrennung über
  die verifizierte `supplierId` (= GPA, [ADR 0008](../architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md)),
  identisches 403/404-Verhalten wie bei Kontrakten (ADR 0009 Abschnitt 3).
- **Dokumenten-Abstraktion** `apps/api/src/documents/`: eigenständiges Modul
  mit austauschbarem `DocumentProvider`-Interface als Anbindungspunkt für
  eine künftige D3-Cloud-API; aktuell als `StubDocumentProvider` implementiert
  (liefert immer eine leere Liste) inklusive einer zusätzlichen
  Ownership-Prüfung gegen die Lieferberechtigung, bevor Dokumente
  ausgeliefert würden (ADR 0009 Abschnitt 8).
- Relevante Code-Pfade: `apps/web/src/delivery-authorizations/*`
  (`DeliveryAuthorizationsListPage`, `DeliveryAuthorizationDetailPage`,
  `DeliveryAuthorizationsOpenPage`, `delivery-authorization-client.ts`),
  `apps/api/src/delivery-authorizations/*`, `apps/api/src/documents/*`.
- Details zu Testabdeckung, Prüfergebnissen und Abweichungen von der ADR:
  siehe Implementierungsnotizen in
  [`docs/backlog/lieferberechtigungen-anzeigen.md`](../backlog/lieferberechtigungen-anzeigen.md)
  sowie [`docs/qa/lieferberechtigungen-anzeigen.md`](../qa/lieferberechtigungen-anzeigen.md).

## Bekannte Einschränkungen/offene Punkte

Diese Funktion ist für den heutigen Entwicklungs-/Testscope freigegeben,
aber **nicht ohne Weiteres produktivtauglich mit echten
Lieferantendaten**. Details in den jeweiligen Berichten, hier nur
zusammengefasst:

- **Keine echte Persistenz.** Lieferberechtigungen werden aktuell
  ausschließlich in einem In-Memory-Repository gehalten; jeder Neustart von
  `apps/api` löscht den Datenbestand. Eine echte Datenbank-/ORM-Anbindung ist
  noch nicht entschieden ([DevOps-Notiz](../devops/lieferberechtigungen-anzeigen.md),
  Rollout-Gate Punkt 4).
- **D3-Cloud-Dokumente liefern aktuell immer eine leere Liste.** Der
  `StubDocumentProvider` ist eine bewusste Übergangslösung; eine reale
  D3-Cloud-Anbindung existiert noch nicht (ADR 0009 Abschnitt 8, "Offene
  Annahmen"). Zusätzlich verschluckt die Detailansicht Fehler beim
  Dokumenten-Laden aktuell stillschweigend (kein sichtbarer Hinweis) — laut
  QA-Bericht vor einer echten D3-Cloud-Anbindung nachzubessern (QA-Befund 1).
- **`apps/mobile` ist nicht Teil dieser Funktion.** Die Umsetzung für die
  mobile App ist bewusst als eigene Folge-Story vorgesehen (Backlog,
  "Nicht-Ziele").
- **Hart codierte lokale API-Basis-URL.** `apps/web` verwendet
  `API_BASE_URL = 'http://localhost:3000'` als Klartext-Konstante ohne
  Umgebungs-/Secrets-Konzept — funktioniert nur lokal, ist eine harte
  Blockade für jeden Staging-/Produktions-Rollout (Security-Befund
  "niedrig", DevOps-Rollout-Gate Punkt 3: Umstellung auf
  `VITE_API_BASE_URL` pro Umgebung, zwingend über HTTPS).
- **403-vs-404-Enumerationsrisiko (Security-Befund "hoch").** Fremde
  Lieferberechtigungs-/Dokument-IDs lassen sich über wiederholtes Anfragen
  von der Existenz her unterscheiden (403 vs. 404) — dieses aus der
  Kontrakte-Domäne bekannte, bislang unentschiedene Risiko betrifft nun
  zwei Endpunkte (`/delivery-authorizations/:id`, `/documents`) und muss vor
  einem Produktiv-Rollout domänenübergreifend entschieden werden
  (DevOps-Rollout-Gate Punkt 1).
- **Unverifizierte `supplierGpa`-Annahme (Security-Befund "mittel").** Ob
  Lobster/SAP für Lieferberechtigungen tatsächlich direkt die GPA liefert
  (statt einer gesonderten, älteren ERP-internen Kennung), ist noch nicht
  mit dem Lobster-/SAP-Integrationsverantwortlichen verifiziert — als hartes
  Gate vor Bau des ersten Ingestion-Adapters festgehalten (ADR 0009, "Offene
  Annahmen"; DevOps-Rollout-Gate Punkt 2).
- **Weitere offene, nicht blockierende Punkte:** kein Audit-Logging für
  Lesezugriffe, keine dokumentierte Rechtsgrundlage/ROPA-Eintrag, ungeklärter
  fachlicher Standardzeitraum (aktuell Platzhalter "heute bis +30 Tage"),
  ungeklärter vollständiger Feldkatalog der Detailansicht über die vier
  Pflichtfelder hinaus. Siehe Backlog ("Offene Fragen") und
  Security-/QA-Berichte für die vollständige Liste.

Vollständige Details, Testfälle und Einzelbewertungen:
[`docs/backlog/lieferberechtigungen-anzeigen.md`](../backlog/lieferberechtigungen-anzeigen.md)
(Story, 18 Akzeptanzkriterien, Nicht-Ziele, offene Fragen),
[ADR 0009](../architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md)
(Architekturentscheidungen),
[`docs/qa/lieferberechtigungen-anzeigen.md`](../qa/lieferberechtigungen-anzeigen.md)
(Freigabe, Testfälle je Akzeptanzkriterium),
[`docs/security/lieferberechtigungen-anzeigen.md`](../security/lieferberechtigungen-anzeigen.md)
(Freigabe, Befunde),
[`docs/devops/lieferberechtigungen-anzeigen.md`](../devops/lieferberechtigungen-anzeigen.md)
(CI-Stand, Rollout-Gate).

## Changelog
- 2026-08-07: Dokumentation für den funktional vollständigen Scope dieser
  Funktion (`apps/web` + `apps/api`) erstellt: Anzeige, Zeitraum-Filter,
  Mehrfachauswahl, Einzel-/Sammel-Öffnen, Dokumenten-Service-Abstraktion,
  Mandantentrennung über GPA. QA und Security haben freigegeben; bekannte
  Einschränkungen (In-Memory-Persistenz, D3-Cloud-Stub, fehlendes
  `apps/mobile`, hart codierte API-Basis-URL, 403-vs-404-Risiko,
  unverifizierte `supplierGpa`-Annahme) dokumentiert.
