# Kontrakte einsehen

> **Hinweis zum Reifegrad:** Diese Funktion befindet sich aktuell noch
> in Entwicklung und ist **nicht produktiv verfügbar**. Es existiert
> bislang nur ein nicht lauffähiger Konturwurf/Prototyp (kein
> `package.json`, kein Server, keine Datenbank, kein Login). QA und
> Security haben den aktuellen Stand geprüft und mit dem Status
> **"Blockiert"** bewertet — insbesondere fehlt der serverseitige
> Zugriffsschutz, der verhindert, dass ein Lieferant Kontrakte eines
> anderen Lieferanten einsehen kann. Die folgende Beschreibung zeigt,
> was die Funktion **können soll**, sobald sie fertiggestellt und
> freigegeben ist — nicht den heutigen Zustand.

## Für Lieferanten

Sobald diese Funktion verfügbar ist, können Sie sich im
Lieferanten-Extranet einloggen und über den Menüpunkt "Kontrakte"
einen Überblick über Ihre eigenen Kontrakte erhalten, ohne dafür bei
Ihrem Ansprechpartner nachfragen zu müssen.

Geplanter Funktionsumfang:

- **Kontraktliste:** Jede Zeile zeigt Kontraktnummer, Artikel/
  Warengruppe, vereinbarte Liefermenge, Gültigkeitszeitraum (von/bis)
  und Status (aktiv/abgelaufen). Abgelaufene Kontrakte sind eindeutig
  als solche gekennzeichnet und optisch von aktiven Kontrakten
  unterscheidbar.
- **Kontraktdetails:** Beim Öffnen eines einzelnen Kontrakts werden
  alle im ERP-System hinterlegten Konditionen (u. a. Preis- und
  Mengenkonditionen) zu genau diesem Kontrakt angezeigt.
- **Datenstand-Hinweis:** Da Kontraktdaten aus dem ERP-System über
  Lobster ins Extranet übertragen werden, wird bei fehlgeschlagener
  oder veralteter Datenübertragung der Zeitpunkt der letzten
  erfolgreichen Aktualisierung angezeigt — Sie sehen also immer, wie
  aktuell die angezeigten Daten sind, statt stillschweigend
  veraltete Werte zu sehen.
- **Leerer Zustand:** Haben Sie aktuell keine Kontrakte im Extranet
  hinterlegt, wird das klar so angezeigt ("Keine Kontrakte
  vorhanden") statt eines leeren oder fehlerhaften Bildschirms.
- **Zugriffsschutz:** Sie sehen ausschließlich Ihre eigenen Kontrakte.
  Ohne gültige Anmeldung werden keine Kontraktdaten angezeigt; Sie
  werden zur Anmeldeseite weitergeleitet.
- Es handelt sich um eine reine Leseansicht: Kontrakte können über
  diese Funktion weder bearbeitet, angelegt noch gelöscht werden. Ein
  Export (PDF/CSV/Excel) ist ebenfalls nicht Teil dieser Funktion.

**Aktueller Stand:** Nichts von dem oben Beschriebenen ist heute
nutzbar. Es gibt noch keine Anmeldemöglichkeit, keinen Menüpunkt und
keine funktionierende Datenanzeige. Ein Termin für die Verfügbarkeit
steht noch nicht fest.

## Für Entwickler

**Architektur:** Laut
[ADR 0001](../architecture/adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)
ist `apps/api` alleiniger Datenhalter für das Extranet-Lesemodell;
`apps/web` liest Kontraktdaten ausschließlich aus `apps/api`, nie
direkt von Lobster/ERP. Definiert sind der Eingangs-Datenkontrakt
(`IncomingContractRecord`) sowie Sync-Metadaten
(`ContractSyncRun`/`lastSuccessfulSyncAt`/`isStale`) für die
Stale-Kennzeichnung aus AC6. Der konkrete Transportmechanismus
Lobster → `apps/api` ist bewusst offen (kein Ingestion-Adapter
implementiert).

Laut
[ADR 0002](../architecture/adr/0002-mandantentrennung-kontrakte.md)
wird Mandantentrennung als Defense-in-Depth-Muster umgesetzt:
`supplierId` stammt ausschließlich aus dem verifizierten
Auth-Kontext (nie aus Client-Eingaben), Routen enthalten keine
Lieferanten-ID (`GET /contracts`, `GET /contracts/:contractId`), und
sowohl Guard als auch Repository-Schicht filtern nach `supplierId`.
Bei Kontrakt-Detailzugriff wird zwischen 404 (nicht existent) und 403
(existiert, gehört anderem Lieferanten) unterschieden — ein von
Security als prüfungswürdiger Trade-off markiertes Verhalten
(Existenz-Enumeration über Statuscode).

**Umsetzungsstand:** Es existiert nur ein Konturwurf ohne
Framework-Anbindung: TypeScript-Typen und ein framework-unabhängiger
`ContractsService` mit korrekter Autorisierungslogik
(`apps/api/src/contracts/`), sowie eine Platzhalter-Listenkomponente
(`apps/web/src/contracts/ContractsListPage.tsx`). Es fehlen: HTTP-
Controller/Guard, Persistenz, Ingestion-Adapter, Auth-/Session-
Mechanismus, Detailansicht, Statusableitungslogik (aktiv/abgelaufen)
und jegliche automatisierten Tests. Details siehe
`docs/backlog/lieferant-kontrakte-einsehen.md` (Implementierungsnotizen),
`docs/qa/lieferant-kontrakte-einsehen.md` und
`docs/security/lieferant-kontrakte-einsehen.md` (beide Status
"Blockiert") sowie `docs/devops/lieferant-kontrakte-einsehen.md`
(CI/Rollout-Vorschlag, noch nicht umgesetzt).

Offene Punkte vor Produktivsetzung: vollständiger Feldkatalog/
Allowlist für Kontraktkonditionen, Statusableitung aktiv/abgelaufen,
Auth-Mechanismus, End-to-End-Test der Mandantentrennung, Entscheidung
zum 403/404-Trade-off, DSGVO-Klärung (Rechtsgrundlage, Aufbewahrung,
Audit-Log für Lesezugriffe).

## Changelog
- 2026-08-04: Dokumentation für den Konturwurf-Stand erstellt; Funktion
  ist noch nicht produktiv verfügbar (Status "Blockiert" laut QA und
  Security).
