# Pipeline-Status: Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

Datum: 2026-08-04

## Schritte

| Schritt | Rolle | Output-Datei | Status |
|---|---|---|---|
| 1 | Product Owner | `docs/backlog/lieferanten-anmeldung-gpa.md` | OK |
| 2 | Architect | `docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md` | OK |
| 3 | Developer | `apps/api/src/auth/*`, `apps/api/src/contracts/contract.types.ts`, `apps/web/src/auth/LoginPage.tsx` u. a. | OK |
| 4 | QA | `docs/qa/lieferanten-anmeldung-gpa.md` | OK |
| 5 | Security | `docs/security/lieferanten-anmeldung-gpa.md` | OK |
| 6 | DevOps | `docs/devops/lieferanten-anmeldung-gpa.md` | OK |
| 7 | Documentation | `docs/product/lieferanten-anmeldung-gpa.md` | OK |

## Zusammenfassung

Die Pipeline hat für "Anmeldung" ADR 0008 hervorgebracht (erweitert ADR 0004,
ohne sie zu ändern): GPA wird der Mandanten-Schlüssel (`supplierId`), eine
GPA-Organization kann mehrere Anmeldungen (Lieferant, Gastbenutzer, Spedition,
Steuerberater) über ein neues, rein transportierendes `userType`-Attribut
tragen, Self-Signup ist ausgeschlossen, und Okta wird per Identity Brokering
hinter ZITADEL geführt. Der Developer hat das Backend-Datenmodell
(`apps/api/src/auth`) inkl. Tests vollständig umgesetzt und einen ersten,
bewusst nicht funktionsfähigen Login-Einstiegspunkt in `apps/web`
(`LoginPage`) angelegt; `apps/mobile` wurde unangetastet gelassen. QA und
Security bewerten den geprüften Teil-Scope übereinstimmend als solide
(GPA-Herkunftsgarantie kryptographisch verifiziert, `userType` nachweislich
ohne Autorisierungswirkung), stufen das Gesamt-Feature aber als funktional
unvollständig und für Produktivbetrieb blockiert ein.

## Offene Risiken / Blocker

Aus Security ("Blockiert für Produktivbetrieb", 3 kritische + 3 hohe Befunde):

1. **Kritisch** — ZITADEL↔Okta-Identity-Föderation ist technisch ungeprüft;
   eine Fehlkonfiguration könnte die im Backend korrekt implementierte
   Mandantentrennung vollständig aushebeln, ohne dass Code das erkennen kann.
2. **Kritisch** — Für Okta fehlen (anders als für ZITADEL) jeglicher
   Datenresidenz- und AVV/DPA-Nachweis — DSGVO-Blocker vor Produktivbetrieb.
3. **Kritisch** — Kein funktionsfähiger Login-/Redirect-/Logout-Flow (deckt
   sich mit QA: AC1, AC7, AC8, AC9 funktional nicht erfüllt).
4. **Hoch** — Schlüssel-Bruch-Risiko zwischen `supplierExternalId` (ADR 0001,
   Lobster/alte ERP-Kennung) und der neuen GPA-basierten `supplierId`; ungelöst
   vor Aktivierung jeder künftigen Kontrakt-/Beleg-Ingestion unter dem
   GPA-Modell.
5. **Hoch** — "Kein Self-Signup" ist bislang nur UI-seitig verifiziert, nicht
   an der tatsächlichen ZITADEL-/Okta-Instanzkonfiguration.
6. **Hoch** — Alle `userType`-Anmeldungen einer GPA haben aktuell identischen
   Datenzugriff; wird kritisch, sobald hochsensible Belege (Steuerbescheid,
   Prämien, Gutschriften) denselben Guard wiederverwenden.
7. **Mittel** — AC3 (Enumeration-Schutz vor MFA) bleibt eine unverifizierte,
   Okta-abhängige Annahme; kein Audit-Logging-Konzept für Login-/
   MFA-Ereignisse (DSGVO-Rechenschaftspflicht).

DevOps bestätigt: CI deckt den neuen Auth-Code bereits automatisch ab, keine
Pipeline-Änderung nötig; für Produktivbetrieb wurde ein 7-Punkte-Gate aus den
Security-Befunden abgeleitet.

## Nächste Schritte

- Echtes OIDC-Client-SDK (PKCE) für `apps/web` und `apps/mobile` integrieren,
  inkl. Redirect-bei-fehlender-Anmeldung und Logout — schließt AC1/AC7/AC8/AC9.
- ZITADEL↔Okta-Föderationskonfiguration einrichten und explizit gegen
  Fehlkonfiguration (insb. Account-Linking nur über GPA-Organisation, nie über
  ungeprüfte Attribute wie E-Mail) verifizieren/pentesten.
- Okta-Tenant-Datenresidenz (EU) klären und AVV/DPA abschließen, analog zum
  bereits für ZITADEL vorliegenden Stand.
- Mapping-/Reconciliation-Strategie `supplierExternalId` ↔ GPA vor jeder
  künftigen Kontrakt-/Beleg-Ingestion unter dem neuen Modell festlegen und
  mit einem dedizierten Mandantentrennungstest absichern.
- Vor Freischaltung von Beleg-Features (Steuerbescheid/Prämie/Gutschrift):
  eigene Berechtigungs-/Sichtbarkeits-ADR für `userType` erarbeiten.
- Audit-Logging-Konzept für Login-/MFA-Ereignisse erarbeiten (Architect/
  Security), ohne Zugangsdaten/Tokens im Klartext zu loggen.
- Konfigurationsnachweis erbringen, dass Selbstregistrierung serverseitig in
  ZITADEL und Okta deaktiviert ist (nicht nur UI-seitig fehlend).
