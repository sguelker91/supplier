# Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

> **Hinweis zum Reifegrad:** Diese Funktion ist aktuell **funktional
> unvollständig und nicht produktiv nutzbar**. **Update (siehe Changelog
> unten):** `apps/web` hat inzwischen einen echten, funktionierenden
> Login/Logout (Authorization Code Flow mit PKCE gegen die reale ZITADEL-
> Instanz, Redirect zur Anmeldeseite bei fehlender Anmeldung, aktive
> Abmeldung). `apps/mobile` hat weiterhin **keine** Login-Oberfläche. Die
> Bewertungen von QA (**"Freigegeben mit Auflagen"**, eng begrenzt auf den
> damals umgesetzten Teil-Scope) und Security (**"Blockiert für einen
> Produktivbetrieb"**, u. a. wegen einer ungeprüften ZITADEL↔Okta-
> Föderations-Vertrauenskette und eines fehlenden AVV/Datenresidenz-
> Nachweises für Okta) beziehen sich auf den Stand **vor** dieser
> Web-Änderung und wurden noch nicht erneut durchgeführt — sie sind daher
> nicht automatisch auf den neuen Stand übertragbar, insbesondere nicht
> auf AC8 (weiterhin kein Mobile-Login, damit keine Gleichbehandlung
> möglich). Die folgende Beschreibung zeigt, was die Funktion **künftig
> können soll**; der tatsächliche Stand ist im Changelog unten
> dokumentiert.

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
- `apps/web/src/auth/zitadel-config.ts`, `auth-client.ts`, `LoginPage.tsx`,
  `AuthCallbackPage.tsx`, `ProtectedArea.tsx`, `LogoutButton.tsx`: **Update
  (siehe Changelog):** echter Login-/Logout-Flow via `react-oidc-context`/
  `oidc-client-ts`, `LoginPage` ist in `App.tsx` verdrahtet und über
  `ProtectedArea` geschützt.
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

- **Kein funktionierender Login-Flow in `apps/mobile`:** `apps/web` hat
  seit dem Update (siehe Changelog) einen echten Login/Logout inkl.
  Redirect bei fehlender/abgelaufener Sitzung; `apps/mobile` ermöglicht
  weiterhin **keine** echte Anmeldung (kein Login-Screen, kein SDK). AC8
  (Gleichbehandlung Web/Mobile) bleibt damit unerfüllt. Die vorherige
  QA-/Security-Bewertung (`docs/qa/lieferanten-anmeldung-gpa.md`,
  `docs/security/lieferanten-anmeldung-gpa.md`) bezieht sich auf den Stand
  vor diesem Update und wurde noch nicht erneut durchgeführt.
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
- 2026-08-04 (Update): **`apps/web` hat jetzt einen echten Login/Logout.**
  `apps/web/src/auth/LoginPage.tsx` löst über die bereits als Dependency
  vorhandenen Bibliotheken `oidc-client-ts`/`react-oidc-context` einen
  echten Authorization-Code-Flow mit PKCE gegen die reale ZITADEL-Instanz
  (`https://supplier-janwkz.eu1.zitadel.cloud`) aus -- kein Platzhalter
  mehr, der immer fehlschlägt. Neu: `AuthCallbackPage.tsx` (Ziel der
  `redirect_uri`, `/auth/callback`, nimmt den Code-Austausch entgegen),
  `ProtectedArea.tsx` (AC7: nicht angemeldete Nutzer sehen die
  Anmeldeseite statt der Kontrakte-Liste) und `LogoutButton.tsx` (AC9:
  beendet die Sitzung und ruft den ZITADEL End-Session-Endpoint auf).
  `App.tsx` verdrahtet `LoginPage` jetzt tatsächlich (zuvor bewusst nicht
  der Fall). Damit sind AC1 (Login), AC7 (Redirect bei fehlender
  Anmeldung) und AC9 (Logout) für **`apps/web`** funktional umgesetzt --
  ein echter Login gegen die reale ZITADEL-Instanz wurde in dieser
  Entwicklungsumgebung mangels Netzwerkzugriff/Testnutzer nicht manuell
  durchgeführt, alle Tests mocken `react-oidc-context`.
  **Weiterhin fehlend/unverändert:** `apps/mobile` hat nach wie vor
  **keinen** Login-Screen und keine SDK-Integration -- AC1/AC7/AC8/AC9
  bleiben für Mobile vollständig offen, AC8 (Gleichbehandlung Web/Mobile)
  ist damit weiterhin nicht erfüllbar. Die eigentliche Okta-MFA-
  Durchsetzung, der Enumeration-Schutz vor MFA (AC2/AC3/AC8) sowie die
  DSGVO-Voraussetzungen (Okta-AVV/Datenresidenz, siehe Security-Bericht)
  bleiben unverändert außerhalb des Scopes dieser Web-Änderung. Details:
  siehe neuer Implementierungsnotiz-Abschnitt in
  `docs/backlog/lieferanten-anmeldung-gpa.md`.
