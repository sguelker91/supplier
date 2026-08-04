# 0001. Lobster-Kontraktdaten: Systemgrenze, Datenkontrakt und Sync-Status

## Status
Vorgeschlagen

## Kontext
Die Backlog-Story ["lieferant-kontrakte-einsehen"](../../backlog/lieferant-kontrakte-einsehen.md)
verlangt eine reine Leseansicht der Kontrakte eines Lieferanten in
`apps/web`. Kontrakte werden im ERP-System gepflegt und über Lobster
(EDI-Middleware) an das Extranet übertragen (Domain-Glossar: Lobster =
Systemgrenze, ERP-System = führendes System für Kontrakte). In diesem
Repository existiert bislang keine Architekturentscheidung dazu, wie
diese Daten in `apps/api` ankommen; `docs/architecture/overview.md`
listet das konkrete Lobster-Anbindungsmuster ausdrücklich als offen.

Die Story schließt eine Änderung der Lobster-Synchronisationslogik
selbst ausdrücklich als Nicht-Ziel aus und setzt voraus, dass
Kontraktdaten "bereits über bestehende Schnittstellen ins Extranet
gelangen". Gleichzeitig fordert Akzeptanzkriterium 6, dass dem
Lieferanten der Zeitpunkt der letzten erfolgreichen Datenaktualisierung
angezeigt wird, wenn die Synchronisation fehlgeschlagen oder veraltet
ist. Das erzwingt eine minimale Entscheidung darüber, welchen
Datenkontrakt `apps/api` an der Lobster-Grenze erwartet und wie
Sync-Aktualität nachvollzogen wird — auch wenn der konkrete
Transportmechanismus (Push/Pull/Datei) selbst nicht Gegenstand dieser
Story ist.

## Entscheidung
1. **`apps/api` ist alleiniger Datenhalter für das Extranet-Lesemodell.**
   `apps/web` liest Kontraktdaten ausschließlich aus einer von `apps/api`
   verwalteten Persistenz (eigene `Contract`-Tabelle), niemals direkt
   von Lobster oder dem ERP-System. Das entkoppelt die Verfügbarkeit der
   Weboberfläche von ERP-/Lobster-Verfügbarkeit und ist der einzige
   Punkt, an dem Autorisierung/Mandantentrennung durchgesetzt wird
   (siehe ADR 0002).
2. **Definierter Datenkontrakt für ankommende Kontraktdaten.** Was die
   Systemgrenze überquert (Lobster → `apps/api`), ist ein
   Kontrakt-Datensatz pro Lieferant-Kontrakt-Beziehung mit mindestens
   folgenden Feldern (erforderlich für AC2/AC3):
   - `contractNumber` — Kontraktnummer, ERP-seitiger fachlicher Schlüssel
   - `supplierExternalId` — ERP-seitige Lieferantenkennung, zur
     Zuordnung auf die lokale `Supplier`-Entität
   - `articleOrProductGroup` — Artikel/Warengruppe
   - `agreedQuantity` inkl. Einheit — vereinbarte Liefermenge
   - `validFrom` / `validTo` — Gültigkeitszeitraum
   - `status` — z. B. aktiv/abgelaufen (Herkunft ERP vs. lokal aus
     `validTo` berechnet: offene Frage, siehe unten)
   - `conditions[]` — Preis-/Mengenkonditionen für die Detailansicht
     (genaue Feldstruktur nicht Teil dieser ADR, siehe offene Annahme)

   Diese Struktur ist der Vertrag, den `apps/api` von der
   Lobster-Anbindung erwartet; sie ist unabhängig vom gewählten
   Transportmechanismus.
3. **Sync-Status als First-Class-Metadatum.** `apps/api` persistiert
   zusätzlich zum Kontraktbestand einen Sync-Status pro Importlauf
   (`ContractSyncRun`: `startedAt`, `completedAt`, `status`
   [success/failed/partial], optionale Fehlerinfo). Die
   Kontrakt-Leseendpunkte liefern zusätzlich zu den Daten den Zeitpunkt
   der letzten *erfolgreichen* Aktualisierung (`lastSuccessfulSyncAt`)
   sowie ein `isStale`-Flag (z. B. wenn der letzte Lauf fehlgeschlagen
   ist oder ein konfigurierbares Alter überschritten wird). Damit legt
   die API die Datengrundlage für AC6; konkrete Schwellenwerte und
   UI-Darstellung liegen bei `apps/web`.
4. **Der konkrete Transportmechanismus zwischen Lobster und `apps/api`
   (Push-Webhook, Datei-Export/Import, Polling gegen eine
   Lobster-Schnittstelle) wird durch diese ADR NICHT festgelegt.** Das
   ist als Nicht-Ziel der Story explizit ausgeschlossen und hier als
   offene Annahme markiert. `apps/api` definiert lediglich den
   erwarteten Eingangs-Datenkontrakt (Punkt 2) und die Sync-Metadaten
   (Punkt 3); ein Ingestion-Adapter, der diesen Kontrakt aus dem
   tatsächlich gewählten Lobster-Anbindungsmuster befüllt, ist
   Voraussetzung für die Umsetzung dieser Story, aber nicht Gegenstand
   dieses Architekturentwurfs.

## Konsequenzen
- `apps/web` bleibt vollständig unabhängig von ERP-/Lobster-Interna;
  Ausfälle dort äußern sich für den Lieferanten nur als "veralteter
  Datenstand" (AC6), nicht als Totalausfall der Ansicht.
- `apps/api` benötigt eine eigene Persistenzschicht für Kontrakte und
  Sync-Läufe, bevor die Lese-Endpunkte implementiert werden können —
  das ist mehr Aufwand als eine reine Proxy-API auf Lobster.
- Solange der tatsächliche Transportmechanismus offen ist, kann kein
  konkreter Ingestion-Adapter implementiert werden; das Team benötigt
  eine Klärung mit dem Lobster-/Integrationsverantwortlichen, welches
  Anbindungsmuster real vorliegt.
- Risiko: Weicht der reale Lobster-Export strukturell ab (andere
  Feldnamen/Granularität), muss eine Mapping-Schicht im
  Ingestion-Adapter ergänzt werden — das ist erwartet und kein Bruch
  dieser ADR, solange der interne Datenkontrakt (Punkt 2) eingehalten
  wird.
- Das exakte Feld-Set für `conditions[]` (Preis-/Mengenkonditionen)
  sowie die Herkunft von `status` bleiben laut Backlog offene fachliche
  Fragen und werden hier nicht spekulativ vorweggenommen — Umsetzung
  sollte mit einem flexiblen (z. B. generischen Line-Item-)Modell
  beginnen, bis der vollständige Feldkatalog geklärt ist.

## Offene Annahmen
- Transportmechanismus Lobster → `apps/api` (Push/Webhook,
  Datei-Batch, Polling) ist unbekannt und nicht Gegenstand dieser
  Story — muss vor Implementierung des Ingestion-Adapters geklärt
  werden.
- Vollständiger Feldkatalog für Kontraktkonditionen (Detailansicht,
  AC3) ist laut Backlog offen.
- Ob `status` (aktiv/abgelaufen) vom ERP als Feld geliefert oder rein
  aus `validTo` vs. aktuellem Datum abgeleitet wird, ist offen; für AC8
  (eindeutige Kennzeichnung "abgelaufen") reicht vorerst eine lokal aus
  `validTo` abgeleitete Berechnung, sofern das ERP kein abweichendes
  Statusfeld liefert.

## Datenklassifizierung
- **Kontrakt** (`Contract`): Ja, DSGVO-/kommerziell sensibel laut
  Domain-Glossar. Betrifft sowohl Listen- als auch Konditionsfelder.
- **Lieferant** (`Supplier`): Ja, Stammdaten-sensibel — wird über
  `supplierExternalId`/`supplierId` referenziert (Zuordnung Kontrakt ↔
  Lieferant).
- **ERP-System**: Ja, laut Glossar als Quelle vieler sensibler Daten
  eingestuft (keine eigene gespeicherte Extranet-Entität, aber
  Herkunftssystem der Kontraktdaten).
- **Lobster**: n/a — Systemgrenze, keine eigene Datenklassifizierung.
