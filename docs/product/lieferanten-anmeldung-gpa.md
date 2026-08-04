# Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

> **Hinweis zum Reifegrad:** Diese Funktion ist aktuell **funktional
> unvollständig und nicht produktiv nutzbar**. Es gibt heute **keinen
> echten, funktionierenden Login**: Der Klick auf "Anmelden" führt in
> `apps/web` bewusst und sichtbar zu einem Fehler, da noch kein
> OIDC-Client-SDK integriert ist; `apps/mobile` hat überhaupt keine
> Login-Oberfläche; es gibt weder eine Weiterleitung zur Anmeldeseite bei
> fehlender Anmeldung noch einen Logout. QA hat den Stand mit
> **"Freigegeben mit Auflagen"** bewertet — eng begrenzt auf den
> tatsächlich umgesetzten Teil-Scope (`apps/api`-Datenmodell,
> `apps/web`-Login-Einstiegspunkt ohne Registrierung); zentrale
> Akzeptanzkriterien der User Story (AC1, AC7, AC8, AC9 — erfolgreicher
> Login, Weiterleitung, MFA-Gleichbehandlung Web/Mobile, Logout) sind
> **funktional nicht erfüllt**. Security bewertet das Gesamt-Feature als
> **"Blockiert für einen Produktivbetrieb"**, u. a. wegen einer
> ungeprüften ZITADEL↔Okta-Föderations-Vertrauenskette und eines fehlenden
> AVV/Datenresidenz-Nachweises für Okta. Die folgende Beschreibung zeigt,
> was die Funktion **künftig können soll**, nicht den heutigen Zustand.

## Zweck/Überblick

Künftig sollen sich Nutzer mit einer der SAP-**Geschäftspartnernummer
(GPA)** eines Lieferanten zugeordneten Anmeldung am Lieferanten-Extranet
anmelden können — mit Zugangsdaten und anschließender
Multi-Faktor-Authentifizierung (MFA) über **Okta**. Wichtige fachliche
Eckpunkte:

- **GPA statt bisheriger ERP-Kennung:** Ein Lieferant wird künftig über
  die SAP-Geschäftspartnernummer identifiziert, nicht mehr über eine
  ERP-eigene Kennung. Alle Zugriffe im Extranet werden intern
  ausschließlich anhand dieser GPA aus dem geprüften Anmeldekontext
  gesteuert.
- **Mehrere Anmeldungen pro GPA:** Zu einer einzelnen GPA (= ein
  Lieferant) können künftig mehrere unterschiedliche, voneinander
  getrennte Anmeldungen existieren — z. B. der Lieferant selbst, ein
  Gastbenutzer, eine Spedition oder ein Steuerberater. Jede dieser
  Anmeldungen erhält einen eigenen Nutzertyp (`userType`), der aber
  **keine** unterschiedlichen Zugriffsrechte bewirkt (siehe "Bekannte
  Einschränkungen" unten) — alle Anmeldungen einer GPA sehen aktuell
  dieselben Daten.
- **Okta-MFA:** Die Mehrfaktor-Authentifizierung erfolgt über Okta, das
  hinter dem bereits als OIDC-Provider entschiedenen ZITADEL eingebunden
  wird. Aus Sicht der Web- und Mobile-App bleibt der Login-Flow ein
  gewöhnlicher Anmeldevorgang gegen ZITADEL.
- **Kein Self-Signup:** Es gibt im Extranet ausschließlich eine
  Anmeldemöglichkeit mit bereits bestehenden Zugangsdaten — keine
  Registrierungs- oder Konto-Anlegen-Funktion, weder in der Web-Anwendung
  noch in der Mobile App.

## Aktueller Stand — in Entwicklung, nicht produktiv nutzbar

**Bereits im Code umgesetzt (nur Backend-Datenmodell und ein rudimentärer
Web-Einstiegspunkt, kein funktionierender Login):**

- `apps/api`: Der Anmeldekontext (`AuthenticatedSupplierContext`) trägt
  die GPA als `supplierId`, ausschließlich abgeleitet aus einem
  kryptographisch verifizierten Token — nie aus Client-Eingaben. Ein
  zusätzliches `userType`-Attribut (Lieferant/Gastbenutzer/Spedition/
  Steuerberater) wird aus dem Token gelesen und im Kontext mitgeführt,
  hat aber **keine** Auswirkung auf Zugriffsrechte: Guard und
  Repository-Filter prüfen weiterhin ausschließlich nach der GPA.
- `apps/web`: Eine `LoginPage`-Komponente existiert als UI-Grundgerüst
  mit einer "Anmelden"-Aktion, die einen sichtbaren, ehrlichen Fehler
  anzeigt (kein vorgetäuschter Erfolg), da noch kein echtes OIDC-SDK
  eingebunden ist. Es gibt keine Registrierungs-/Sign-up-Option (dies ist
  durch Tests abgesichert).

**Fehlt noch — Kernbestandteile eines nutzbaren Logins:**

- Ein tatsächlich funktionierender OIDC-Login-Flow (Web): Der
  "Anmelden"-Button in `apps/web` führt heute **immer** zu einem Fehler,
  nicht zu einer erfolgreichen Anmeldung.
- Jegliche Login-Oberfläche in der Mobile App (`apps/mobile`): kein
  Login-Bildschirm, keine SDK-Integration.
- Eine Weiterleitung zur Anmeldeseite, wenn ein Nutzer ohne gültige
  Anmeldung auf geschützte Bereiche zugreift (Web und Mobile).
- Ein Logout/Abmelde-Mechanismus (weder Web noch Mobile noch Backend).
- Die eigentliche Okta-MFA-Durchsetzung sowie der Enumeration-Schutz vor
  MFA hängen von einer noch nicht eingerichteten und noch nicht
  verifizierten ZITADEL-/Okta-Föderationskonfiguration ab.

## Für Entwickler

**Relevante Code-Pfade:**

- `apps/api/src/auth/user-type.ts`, `zitadel-token.types.ts`,
  `jose-token-verifier.ts`, `testing/fake-token-verifier.ts`,
  `auth-guard.service.ts`: Extraktion von GPA (als `supplierId`) und
  `userType` aus dem verifizierten ZITADEL-Token; `userType` wird
  ausschließlich transportiert, nie für Autorisierung ausgewertet.
- `apps/api/src/contracts/contract.types.ts`: `AuthenticatedSupplierContext`
  mit `supplierId` (= GPA) und optionalem `userType`.
- `apps/web/src/auth/auth-client.ts` und `LoginPage.tsx`: bewusst
  fehlschlagender Login-Einstiegspunkt (kein OIDC-SDK integriert);
  `LoginPage` ist nicht in `App.tsx` verdrahtet.
- `apps/mobile/src/auth/*`: unverändert, kein Login-Code.

**Architektur-Referenzen** (Details dort, nicht hier dupliziert):

- [ADR 0004](../architecture/adr/0004-zitadel-oidc-authentifizierung.md) —
  Basisentscheidung: ZITADEL Cloud als OIDC-Provider, tokenbasiertes
  Modell, Verifikation in `apps/api` gegen den ZITADEL-JWKS-Endpunkt,
  eine ZITADEL-Organization pro Mandant.
- [ADR 0008](../architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md) —
  erweitert ADR 0004: GPA als `supplierId`, mehrere Anmeldungen/`userType`
  pro GPA-Organization, kein Self-Signup, Okta als föderierter Identity
  Provider via Identity Brokering in ZITADEL.

## Bekannte Einschränkungen/offene Punkte

- **Kein funktionierender Login-Flow:** Weder Web noch Mobile ermöglichen
  aktuell eine echte Anmeldung; es gibt keinen Logout und keine
  Weiterleitung zur Anmeldeseite bei fehlender/abgelaufener Sitzung
  (siehe `docs/qa/lieferanten-anmeldung-gpa.md`, AC1/AC7/AC8/AC9).
- **Alle Nutzertypen einer GPA haben identischen Zugriff:** Lieferant,
  Gastbenutzer, Spedition und Steuerberater sehen aktuell dieselben
  lieferantenscoped Daten; es gibt bewusst noch keine
  Berechtigungs-/Sichtbarkeitsunterscheidung nach `userType`. Das ist
  eine bewusste Scope-Grenze dieser Story, wird aber laut Security
  spätestens beim Zugriff auf hochsensible Belege (Steuerbescheid,
  Prämien, Gutschriften) zu einem eigenen Klärungsbedarf.
- **Eine Anmeldung mit mehreren GPA-Zuordnungen wird nicht unterstützt:**
  Das Datenmodell geht von genau einer GPA pro Anmeldung/Token aus (z. B.
  ein Steuerberater mit mehreren Mandanten ist nicht abgebildet).
- **Okta-MFA-Details hängen von der finalen ZITADEL-/Okta-Konfiguration
  ab:** Der Enumeration-Schutz vor MFA (keine Unterscheidbarkeit
  "GPA/Anmeldung existiert nicht" vs. "Passwort falsch") ist reines
  Verhalten der noch nicht eingerichteten Okta-Login-UI/-Policy und laut
  ADR 0008 selbst nur eine "zu verifizierende Annahme", keine garantierte
  Eigenschaft der Architektur.
- **Ungeprüfte Identity-Föderation ZITADEL↔Okta:** Laut Security-Bericht
  ist die Vertrauenskette zwischen ZITADEL und Okta technisch ungeprüft;
  eine Fehlkonfiguration dort könnte die im Backend korrekt umgesetzte
  Mandantentrennung aushebeln, ohne dass dies im Code erkennbar wäre.
- **DSGVO/AVV:** Für Okta als zusätzlichen Auftragsverarbeiter sind
  Datenresidenz und ein Auftragsverarbeitungsvertrag (AVV/DPA) noch
  nicht dokumentiert — anders als für ZITADEL (dort liegt zumindest eine
  EU-Instanz vor). Dies ist eine harte Voraussetzung vor Produktivbetrieb.
- **Schlüssel-Bruch-Risiko:** Der Wechsel von der bisherigen ERP-Kennung
  auf die GPA als Mandanten-Schlüssel ist an der Lobster-Kontrakt-Grenze
  (`supplierExternalId`) noch nicht aufgelöst — ein künftiger
  Kontrakt-/Beleg-Ingestion-Adapter muss dieses Mapping klären, bevor er
  aktiviert wird.
- Weitere Details, Testfälle und Einzelbewertungen: siehe
  `docs/backlog/lieferanten-anmeldung-gpa.md` (Story, Akzeptanzkriterien,
  Nicht-Ziele, offene Fragen), `docs/qa/lieferanten-anmeldung-gpa.md`
  (Freigabe mit Auflagen, detaillierte Testfälle je AC) und
  `docs/security/lieferanten-anmeldung-gpa.md` (Freigabe mit Auflagen,
  kritische Befunde). `docs/devops/lieferanten-anmeldung-gpa.md`
  beschreibt den CI-Stand (Tests laufen grün in der Pipeline) sowie ein
  mehrstufiges Produktions-Gate, das vor einem echten Rollout erfüllt
  sein muss.

## Changelog
- 2026-08-04: Dokumentation für den aktuellen, funktional unvollständigen
  Stand erstellt (GPA-Datenmodell und `userType`-Attribut in `apps/api`,
  Login-Einstiegspunkt ohne funktionierenden OIDC-Flow in `apps/web`);
  kein Logout, kein Mobile-Login, keine Redirect-Logik. Domain-Glossar um
  "GPA / Geschäftspartnernummer" ergänzt (siehe `docs/domain-glossar.md`).
