# Pipeline-Status: Lieferberechtigungen anzeigen

Datum: 2026-08-07

## Schritte

| Schritt | Rolle | Output-Datei | Status |
|---|---|---|---|
| 1 | Product Owner | `docs/backlog/lieferberechtigungen-anzeigen.md` | OK |
| 2 | Architect | `docs/architecture/adr/0009-lieferberechtigungen-design-system-backend-dokumentenabstraktion.md` | OK |
| 3 | Developer | `apps/api/src/delivery-authorizations/*`, `apps/api/src/documents/*`, `apps/web/src/design-system/*`, `apps/web/src/delivery-authorizations/*`, `apps/web/src/App.tsx` u. a. | OK |
| 4 | QA | `docs/qa/lieferberechtigungen-anzeigen.md` | OK |
| 5 | Security | `docs/security/lieferberechtigungen-anzeigen.md` | OK |
| 6 | DevOps | `docs/devops/lieferberechtigungen-anzeigen.md` | OK |
| 7 | Documentation | `docs/product/lieferberechtigungen-anzeigen.md` | OK |

## Zusammenfassung

Ausgehend von der vom Nutzer bereitgestellten fachlichen Anforderung
(`features/lieferberechtigungen.md`) und den Design-Referenzen
(`Design/APP.png` als neue Stilquelle, `Design/Lieferberechtigungen.png`
als reine Altsystem-Funktionsreferenz) hat die Pipeline das erste
vollständig funktionsfähige `apps/web`-Feature seit dem Login
hervorgebracht. ADR 0009 legt die Grundlage für ein internes,
minimalistisches Design-System (CSS-Tokens + Card/AppShell/DataTable/
DateRangeFilter, kein externes UI-Kit), führt `react-router-dom` als
erstes echtes Routing für `apps/web` ein und definiert zwei neue
`apps/api`-Module (`delivery-authorizations` analog zum bestehenden
Kontrakte-Muster, `documents` als austauschbare D3-Cloud-Abstraktion mit
explizitem, inzwischen zusätzlich gehärtetem Ownership-Check). Der
Developer hat alle Bausteine inkl. Tests umgesetzt (api 42, web 53,
mobile 21 — alle grün), QA hat alle 18 Akzeptanzkriterien verifiziert
und **freigegeben**, Security hat die kritischste Design-Vorgabe
(Mandantentrennung an der neuen `/documents`-Grenze) unabhängig
nachvollzogen und ebenfalls **freigegeben** — mit einem hohen und zwei
mittleren, nicht blockierenden Befunden, von denen einer (fehlender
Exhaustiveness-Schutz im `DocumentsController`) noch während dieses
Durchlaufs direkt behoben wurde.

## Offene Risiken / Blocker

Keine blockierenden Befunde für den aktuellen Scope (Entwicklungsstand,
In-Memory-/Stub-Backend, synthetische Testdaten). Vor Produktivbetrieb mit
echten Lieferantendaten offen (aus Security-/DevOps-Bericht):

1. **Hoch** — 403-vs-404-Enumerationsrisiko: unverändert aus der
   Kontrakte-Domäne übernommen, jetzt auf zwei Endpunkte
   (`/delivery-authorizations/:id`, `/documents`) verdoppelt und weiterhin
   nicht final durch Security/Product entschieden (opake IDs vs.
   einheitliches 404 für "nicht gefunden ODER fremd").
2. **Mittel** — `supplierGpa`-Annahme an der Lobster-Grenze ist
   unverifiziert; muss vor Bau eines Lieferberechtigungs-Ingestion-Adapters
   mit dem Lobster-/SAP-Integrationsverantwortlichen geklärt werden.
3. **Mittel, bereits erledigt** — hartverdrahteter Ownership-Check im
   `DocumentsController` war ohne Compiler-Leitplanke gegen künftiges
   Vergessen bei neuen `subjectType`-Werten abgesichert; per
   Exhaustiveness-Check (`never`-Fallback) noch in diesem Durchlauf
   behoben.
4. **Niedrig** — `API_BASE_URL` weiterhin hart codiert auf
   `http://localhost:3000` (bereits bekannte, geerbte Lücke aus der
   Anmeldung-Story, jetzt zusätzlich für Lieferberechtigungen/Dokumente
   wirksam).
5. Bekannte, domänenübergreifende offene Punkte ohne neue Verschärfung:
   kein Audit-Logging, keine dokumentierte Rechtsgrundlage/ROPA, In-Memory-
   Persistenz statt echter Datenbank.

## Nächste Schritte

- Domänenübergreifende Grundsatzentscheidung zum 403-vs-404-
  Enumerationsrisiko treffen (gilt inzwischen für Kontrakte UND
  Lieferberechtigungen/Dokumente) — opake IDs oder einheitliches 404.
- `supplierGpa`-Annahme für Lieferberechtigungen mit dem Lobster-/SAP-
  Integrationsverantwortlichen verifizieren, bevor ein echter
  Ingestion-Adapter gebaut wird.
- `API_BASE_URL` vor jedem echten Rollout auf `VITE_API_BASE_URL` (HTTPS,
  pro Vercel-Environment) umstellen.
- In-Memory-Repository durch echte Persistenz ersetzen, sobald eine
  Datenbank-Entscheidung getroffen ist (weiterhin offene Lücke aus ADR
  0001).
- `apps/mobile`-Folge-Story für Lieferberechtigungen angehen, sobald
  gewünscht.
- Reales Hintergrundfoto (`apps/web/Gemini_Generated_Image_avjy2favjy2favjy.png`)
  in die Login-Seite einbinden — weiterhin offen aus einem früheren
  Auftrag.
