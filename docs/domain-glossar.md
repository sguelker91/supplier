# Domain-Glossar: Lieferanten-Extranet

Verbindliche Fachterminologie für alle Agenten und Mitwirkenden. Erweiterungen
sind erlaubt, aber nur **additiv** — bestehende Einträge werden nicht ohne
Architect-Freigabe (ADR) umbenannt oder inhaltlich geändert.

| Begriff | Code-Bezeichnung (EN) | Definition | DSGVO-sensibel |
|---|---|---|---|
| Lieferant | `Supplier` | Externe Vertragspartei, die Waren/Leistungen liefert | Ja (Stammdaten) |
| Lieferberechtigung | `DeliveryAuthorization` | Nachweis/Freigabe, dass ein Lieferant für bestimmte Artikel/Zeiträume liefern darf | Teilweise |
| Kontrakt | `Contract` | Vertraglich vereinbarte Liefermenge/-konditionen zwischen Lieferant und Unternehmen | Ja (kommerziell) |
| Abnahmeschein | `AcceptanceCertificate` / `GoodsReceiptNote` | Bestätigung der Warenannahme/-abnahme durch das Unternehmen | Teilweise |
| Beleg | `Document` | Oberbegriff für hochgeladene/bereitgestellte Dokumente | Abhängig vom Typ |
| Steuerbescheid | `TaxCertificate` | Amtliches steuerliches Dokument des Lieferanten | Ja, hochsensibel |
| Prämie | `Bonus` / `Premium` | Leistungsabhängige Zusatzvergütung an den Lieferanten | Ja, finanziell |
| Gutschrift | `CreditNote` | Finanzieller Ausgleichsbeleg zugunsten des Lieferanten | Ja, finanziell |
| Mengenmeldung | `QuantityDeclaration` | Meldung gelieferter/geplanter Mengen durch den Lieferanten an das Unternehmen | Teilweise |
| Abfrage / Umfrage | `Query` / `Survey` | Strukturierte Rückfrage oder Umfrage an Lieferanten | Nein (i. d. R.) |
| Lobster | `Lobster` (EDI-Middleware) | Externes Integrations-/EDI-Tool, Schnittstelle zwischen ERP und Extranet | n/a (Systemgrenze) |
| ERP-System | `ERP System` | Führendes System für Stammdaten, Kontrakte, Belege (aktuell: SAP; siehe Eintrag "GPA / Geschäftspartnernummer" und [ADR 0008](architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md) zum Wechsel des primären Mandanten-Schlüssels) | Ja (Quelle vieler sensibler Daten) |
| GPA / Geschäftspartnernummer | `businessPartnerNumber` (Feld z. B. `Supplier.gpa`, Claim in `AuthenticatedSupplierContext.supplierId`) | SAP-seitige eindeutige Kennung eines Lieferanten (Geschäftspartner). Löst gemäß [ADR 0008](architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md) die bisherige, ERP-eigene Lieferantenkennung als primären Mandanten-Schlüssel im Extranet ab (`supplierId` im verifizierten Auth-Kontext ist künftig die GPA). Die SAP-interne Vergabe/Formatierung der GPA selbst ist Lobster/ERP-Systemgrenzen-Detail und nicht Teil dieses Glossars | Ja (Stammdaten, eindeutige Identifizierung einer externen Vertragspartei) |

## Hinweise zur Nutzung

- Code-Bezeichnungen (Spalte "Code-Bezeichnung") sind für Bezeichner in Code,
  APIs und Datenmodellen zu verwenden — die deutschen Begriffe für
  UI-Texte, Dokumentation und fachliche Kommunikation.
- Bei Unsicherheit, ob ein neuer Begriff bereits existiert: dieses Glossar
  zuerst durchsuchen, bevor ein neuer Begriff eingeführt wird.
- Mandantentrennung: Daten zu Lieferberechtigung, Kontrakt, Abnahmeschein und
  Beleg sind immer lieferantenscharf zu betrachten — ein Lieferant darf nie
  Daten eines anderen Lieferanten einsehen können. Der dafür verwendete
  fachliche Schlüssel ist seit [ADR 0008](architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md)
  die GPA, nicht mehr die bisherige ERP-eigene Kennung.
- Verhältnis "ERP-System" ↔ "GPA": "ERP-System" bleibt der generische
  Glossar-Begriff für das führende Stammdatensystem (Systemgrenze zu
  Lobster/Extranet, siehe [ADR 0001](architecture/adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md)).
  "GPA" bezeichnet speziell den von diesem System (aktuell SAP) vergebenen
  Lieferanten-Identifikator, der als Mandanten-Schlüssel ins Extranet
  überführt wird. Beide Begriffe werden bewusst getrennt geführt, statt
  "ERP-System" in "SAP" umzubenennen — falls sich die konkrete
  ERP-Systemwahl künftig erneut ändert, bleibt "GPA" als fachlicher Begriff
  unabhängig davon gültig.
