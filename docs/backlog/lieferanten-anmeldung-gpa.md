# Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

## Kontext

Bisher wurde ein Lieferant im Extranet über eine ERP-eigene Kennung
identifiziert, wobei implizit von einem 1:1-Verhältnis zwischen einem
Lieferanten und genau einer Anmeldung ausgegangen wurde (so auch in
[ADR 0002](../architecture/adr/0002-mandantentrennung-kontrakte.md) und
[ADR 0004](../architecture/adr/0004-zitadel-oidc-authentifizierung.md) als
Modell "ein Lieferant = ein Mandant/eine Organisation" beschrieben). Diese
Story **erweitert** dieses Modell, sie widerspricht ihm nicht: Die
Mandantentrennung nach Lieferant bleibt bestehen, aber pro Mandant können
künftig mehrere unterschiedliche Anmeldungen existieren.

Zwei fachliche Änderungen liegen dieser Story zugrunde:

1. **Stammdatenquelle wechselt auf SAP.** Lieferanten werden künftig über
   eine SAP-**Geschäftspartnernummer (GPA)** identifiziert statt über die
   bisherige ERP-eigene Kennung. Der Begriff "GPA"/"Geschäftspartnernummer"
   ist aktuell **nicht** als verbindlicher Fachbegriff im
   [Domain-Glossar](../domain-glossar.md) geführt (Stand dieser Story).
   **Hinweis an Architect/Documentation:** Das Glossar sollte um "GPA" /
   "Geschäftspartnernummer" ergänzt werden, inkl. Klärung, wie sich dieser
   Begriff zum bestehenden Eintrag "ERP-System" verhält (bezeichnet
   "ERP-System" künftig SAP, oder wird SAP als zusätzliche/neue führende
   Quelle separat geführt?). Diese Klärung ist ausdrücklich **nicht**
   Aufgabe dieser Story bzw. des PO, sondern wird hier nur als Auftrag an
   Architect/Documentation vermerkt.
2. **Mehrere Anmeldungen pro GPA.** Auf eine einzelne GPA (= ein Lieferant)
   können mehrere unterschiedliche Nutzer/Anmeldungen existieren, z. B. der
   Lieferant selbst, ein Gastbenutzer, eine Spedition oder ein
   Steuerberater. Das bisherige Modell "ein Lieferant = eine Anmeldung"
   gilt damit nicht mehr uneingeschränkt. Ob und wie sich die Sichtbarkeit
   von Daten (z. B. Belege) zwischen diesen Nutzertypen unterscheidet, wird
   in dieser Story bewusst **nicht** festgelegt (siehe Offene Fragen) —
   das wäre eine eigene Berechtigungs-Entscheidung von Architect/Security.

Zusätzlich gilt: Es gibt im Extranet ausschließlich einen Login, **keine**
Registrierungs-/Sign-up-Möglichkeit. Wie eine Anmeldung zu einer GPA
zustande kommt (Provisionierung), ist außerhalb des Scopes dieser Story.

Die Multi-Faktor-Authentifizierung erfolgt über **Okta**. Laut
[ADR 0004](../architecture/adr/0004-zitadel-oidc-authentifizierung.md) ist
bereits **ZITADEL Cloud** als OIDC-Provider für das Extranet entschieden;
die naheliegende technische Lösung für die Okta-Anbindung wäre eine
Föderation/Identity-Brokering von Okta als externem Identity Provider
innerhalb von ZITADEL. Das ist jedoch eine **Architektur-Entscheidung**,
keine Produktentscheidung dieser Story — die Akzeptanzkriterien unten sind
daher bewusst auf Verhaltensebene formuliert ("Login erfordert erfolgreiche
Okta-MFA"), nicht auf Implementierungsebene.

**Hinweis für Security/QA:** Login- und Identitätsdaten (Zugangsdaten,
MFA-Status, Zuordnung Anmeldung ↔ GPA) sind **personenbezogen und
DSGVO-relevant**. Diese Story betrifft außerdem indirekt den Zugriff auf
Belege (Steuerbescheid, Prämien, Gutschriften) und Kontrakte, da diese
künftig von mehreren unterschiedlichen Anmeldungen pro GPA aus erreichbar
sein könnten — Security muss gezielt prüfen, ob und wie sich das auf
bestehende Mandantentrennungs-Annahmen (ADR 0002/ADR 0004) auswirkt.

## User Story

Als Nutzer mit einer einer Geschäftspartnernummer (GPA) zugeordneten
Anmeldung (z. B. als Lieferant, Gastbenutzer, Spedition oder
Steuerberater) möchte ich mich mittels Zugangsdaten und anschließender
Multi-Faktor-Authentifizierung über Okta am Lieferanten-Extranet anmelden,
damit ich sicher und mandantengetrennt auf die für meine Anmeldung
freigegebenen Daten der zugehörigen GPA zugreifen kann, ohne dass ich mich
selbst registrieren muss.

## Akzeptanzkriterien

1. **Given** ein Nutzer besitzt eine aktive, einer GPA zugeordnete
   Anmeldung, **when** er auf der Login-Seite des Extranets (Web und
   Mobile App) gültige Zugangsdaten eingibt und anschließend die von Okta
   angeforderte Multi-Faktor-Authentifizierung erfolgreich abschließt,
   **then** wird er erfolgreich angemeldet und erhält Zugriff auf das
   Extranet.
2. **Given** ein Nutzer gibt gültige Zugangsdaten ein, **when** die
   Okta-MFA nicht erfolgreich abgeschlossen wird (z. B. falscher Code,
   Abbruch, Zeitüberschreitung), **then** wird kein Zugriff auf das
   Extranet gewährt und es werden keinerlei Daten der zugehörigen GPA
   ausgeliefert.
3. **Given** ein Nutzer gibt ungültige Zugangsdaten ein, **when** der
   Login-Versuch ausgewertet wird, **then** wird die Anmeldung abgelehnt,
   bevor überhaupt eine MFA-Aufforderung erfolgt, und es wird eine
   generische Fehlermeldung angezeigt, die nicht erkennen lässt, ob die
   GPA/Anmeldung existiert oder ob konkret das Passwort falsch war
   (Schutz gegen Enumeration).
4. **Given** eine GPA hat mehrere unterschiedliche, voneinander getrennte
   Anmeldungen hinterlegt (z. B. Lieferant, Gastbenutzer, Spedition,
   Steuerberater), **when** sich einer dieser Nutzer erfolgreich anmeldet,
   **then** wird seine Sitzung eindeutig genau dieser einen Anmeldung und
   genau der zugehörigen GPA zugeordnet — es kommt zu keiner Vermischung
   von Sitzungen/Zugriffskontexten unterschiedlicher Anmeldungen derselben
   GPA.
5. **Given** eine erfolgreich authentifizierte Sitzung, **when** im
   weiteren Verlauf auf Extranet-Funktionen zugegriffen wird, **then**
   wird intern ausschließlich die Geschäftspartnernummer (GPA) als
   Kennung des zugehörigen Lieferanten aus dem verifizierten Auth-Kontext
   verwendet — nicht die bisherige ERP-eigene Kennung und nicht ein vom
   Client mitgesendeter Wert.
6. **Given** ein Nutzer ruft die Login-Seite des Extranets (Web oder
   Mobile App) auf, **when** er nach einer Möglichkeit sucht, ein eigenes
   Konto/eine eigene Anmeldung neu anzulegen, **then** bietet weder die
   Web-Oberfläche noch die Mobile App eine Registrierungs-/Sign-up-Funktion
   an; die einzige im Extranet sichtbare Möglichkeit ist die Anmeldung mit
   bereits bestehenden Zugangsdaten.
7. **Given** ein Nutzer ist nicht angemeldet oder seine Sitzung/sein Token
   ist abgelaufen, **when** er versucht, auf einen geschützten Bereich des
   Extranets zuzugreifen (z. B. Kontrakte, Belege), **then** wird er zur
   Anmeldeseite weitergeleitet und es werden keine Daten ausgeliefert
   (konsistent mit dem bereits für Kontrakte spezifizierten Verhalten in
   `docs/backlog/lieferant-kontrakte-einsehen.md`, AC7), zusätzlich unter
   der hier neu eingeführten Okta-MFA-Pflicht.
8. **Given** die Anmeldung erfolgt über die Web-Anwendung, **when** der
   Login-Flow durchlaufen wird, **then** wird die Okta-MFA durchgesetzt,
   bevor Zugriff auf das Extranet gewährt wird — **and** dasselbe gilt
   unverändert für die Anmeldung über die Mobile App (keine Ausnahme für
   einen der beiden Client-Typen).
9. **Given** ein Nutzer hat bereits erfolgreich Zugangsdaten und Okta-MFA
   durchlaufen, **when** er sich aktiv abmeldet, **then** wird die Sitzung
   beendet und ein erneuter Zugriff auf geschützte Bereiche erfordert eine
   vollständige erneute Anmeldung inklusive Okta-MFA.

## Betroffene Domänenbegriffe

- Lieferant
- ERP-System (Hinweis: diese Story impliziert einen Wechsel der
  Stammdatenquelle auf SAP — betrifft möglicherweise die Definition dieses
  Glossar-Eintrags, siehe Offene Fragen)
- **GPA / Geschäftspartnernummer** — in dieser Story fachlich zwingend
  benötigter Begriff, aber **aktuell nicht** im Domain-Glossar geführt.
  Architect/Documentation sollten diesen Begriff vor oder während der
  Umsetzung additiv ins Glossar aufnehmen (siehe Kontext).

## Nicht-Ziele

- Keine Definition einer Berechtigungs-/Sichtbarkeitsmatrix je Nutzertyp
  (Lieferant, Gastbenutzer, Spedition, Steuerberater) — insbesondere wird
  hier **nicht** festgelegt, ob z. B. ein Steuerberater dieselben Belege
  (Steuerbescheid, Prämien, Gutschriften) sehen darf wie der Lieferant
  selbst. Das ist Gegenstand einer eigenen, von Architect/Security zu
  erarbeitenden Folge-Entscheidung.
- Keine Selbstregistrierung/Sign-up-Funktion im Extranet.
- Keine Spezifikation der Provisionierung von Anmeldungen (Anlegen,
  Deaktivieren, Zuordnen einer Anmeldung zu einer GPA) — dieser Prozess
  liegt außerhalb des Extranets und ist nicht Teil dieser Story.
- Keine Migration bestehender Lieferanten-Konten/-Kennungen von der
  bisherigen ERP-eigenen Kennung auf die GPA (Datenmigrationsstrategie ist
  eine eigene, technische Folge-Aufgabe).
- Keine Festlegung des konkreten technischen Föderationsmechanismus
  zwischen Okta und ZITADEL (Identity Brokering, Claims-Mapping o. Ä.) —
  das ist eine Architektur-Entscheidung (siehe Hinweis auf ADR 0004 im
  Kontext), keine Produktentscheidung dieser Story.
- Keine Aussage darüber, ob eine einzelne Anmeldung mehreren GPA
  zugeordnet sein kann (z. B. ein Steuerberater, der mehrere Lieferanten
  betreut) — nur die Richtung "eine GPA hat mehrere Anmeldungen" ist
  Gegenstand dieser Story (siehe Offene Fragen).
- Keine Spezifikation von Passwort-Reset-/"Passwort vergessen"-Flows,
  Kontosperrungen bei wiederholten Fehlversuchen oder Token-/
  Sitzungslebensdauer.

## Offene Fragen

- Wie soll das Domain-Glossar den Begriff "GPA"/"Geschäftspartnernummer"
  führen, und wie verhält sich dieser Begriff zum bestehenden Eintrag
  "ERP-System" (bezeichnet dieser künftig SAP, oder wird SAP als
  eigenständiges System geführt)? Zu klären mit Architect/Documentation.
- Wie wirkt sich das GPA-Mehrfachanmeldungs-Modell auf das in ADR 0004
  beschriebene Mandantenmodell ("eine ZITADEL-Organization pro
  Lieferant") aus — muss eine Organisation künftig explizit mehrere
  Nutzer-Identitäten (Lieferant, Gastbenutzer, Spedition, Steuerberater)
  zulassen, und wie wird das im Auth-Kontext (`AuthenticatedSupplierContext`
  o. Ä.) abgebildet? Zu klären mit Architect.
- Welche unterschiedlichen Sichtbarkeiten/Berechtigungen sollen die
  verschiedenen Nutzertypen je GPA erhalten (insbesondere Zugriff auf
  Steuerbescheid, Prämien, Gutschriften und Kontrakte)? Explizit **nicht**
  in dieser Story entschieden — zu klären mit Architect/Security als
  eigene Folge-Entscheidung.
- Wie erfolgt die Provisionierung neuer Anmeldungen zu einer GPA (wer legt
  sie an, wie werden Okta/ZITADEL dafür befüllt), und wer ist dafür
  fachlich/organisatorisch verantwortlich?
- Wie wird technisch die Föderation zwischen Okta (MFA-Provider) und
  ZITADEL (laut ADR 0004 bereits entschiedener OIDC-Provider) umgesetzt
  (z. B. Identity Brokering/externer IdP innerhalb ZITADEL)? Zu klären mit
  Architect.
- Kann eine einzelne Anmeldung mehreren GPA zugeordnet sein (z. B. ein
  Steuerberater mit mehreren Mandanten)? Falls ja, wie wirkt sich das auf
  Mandantenwechsel/Kontext-Auswahl im Extranet aus?
- Wie erfolgt die Migration bestehender Lieferanten-Konten von der
  bisherigen ERP-eigenen Kennung auf die GPA (Datenabgleich, Übergangszeit
  mit beiden Kennungen, Fehlerbehandlung bei fehlender Zuordnung)?
- Welche Sitzungsdauer/Token-Lebensdauer und Refresh-Strategie gelten
  (siehe bereits in ADR 0004 als offen markiert)?
- Gibt es Anforderungen an Audit-Logging für Login-/MFA-Ereignisse
  (insbesondere für DSGVO-Rechenschaftspflicht), analog zu den bereits im
  Security-Bericht `docs/security/lieferant-kontrakte-einsehen.md`
  benannten Audit-Log-Empfehlungen?
- Ist ein AVV/DPA mit Okta (analog zur bereits für ZITADEL Cloud in
  ADR 0004 geforderten Klärung von Datenresidenz/AVV) erforderlich und vor
  Produktivbetrieb geklärt?

## Implementierungsnotizen

Umgesetzt gemäß [ADR 0008](../architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md),
aufbauend auf dem bereits als echtes NestJS-/React-/Expo-Monorepo
bestehenden Grundgerüst aus ADR 0004/PR #4. Fokus: `apps/api` (verbindlich)
und `apps/web` (Login-Einstiegspunkt), `apps/mobile` bewusst nicht
erweitert (Begründung siehe unten).

**`apps/api` — GPA als `supplierId`, `userType`-Claim (ADR 0008 Punkt 1/2):**

- `apps/api/src/auth/user-type.ts` (neu): `SupplierUserType`-Enum
  (`SUPPLIER`, `GUEST`, `FREIGHT_FORWARDER`, `TAX_ADVISOR` — exakte
  Bezeichner sind laut ADR 0008 Umsetzungsdetail) sowie
  `parseSupplierUserType()`, das einen rohen Claim-Wert tolerant auf einen
  bekannten Typ abbildet oder `null` liefert (unbekannter/fehlender Wert
  ist laut ADR 0008 explizit **kein** Fehlerfall, anders als eine fehlende
  GPA).
- `apps/api/src/auth/zitadel-token.types.ts`: `RawZitadelTokenPayload` um
  Platzhalter-Claim `user_type?: string` ergänzt; Kommentare zu
  `org_id`/`urn:zitadel:iam:user:resourceowner:id` präzisiert, dass dieser
  Claim seit ADR 0008 fachlich die GPA trägt. `VerifiedTokenClaims` um
  `userType: SupplierUserType | null` ergänzt.
- `apps/api/src/auth/jose-token-verifier.ts` und
  `apps/api/src/auth/testing/fake-token-verifier.ts`: extrahieren
  `userType` zusätzlich zur Organization-ID (identische Logik in beiden,
  konsistent mit dem bereits bestehenden Duplizierungsmuster zwischen
  echter und Test-Implementierung).
- `apps/api/src/contracts/contract.types.ts`:
  `AuthenticatedSupplierContext` um optionales Feld `userType?:
  SupplierUserType` erweitert; Kommentar zu `supplierId` präzisiert von
  "1:1-Kurzschluss mit `organizationId` als Konturwurf-Annahme" (ADR 0004)
  zu der jetzt verbindlichen fachlichen Aussage `supplierId === GPA`
  (ADR 0008 Entscheidung Punkt 1). Datei liegt bewusst weiterhin unter
  `contracts/` statt in einem eigenen `auth/`-Ort, um nicht mehr Dateien
  als nötig zu verschieben — das ist bestehende Struktur aus ADR
  0004/PR #4, keine neue Festlegung dieser Story; eine künftige
  Aufräum-ADR könnte diesen Typ nach `auth/` verschieben.
- `apps/api/src/auth/auth-guard.service.ts`: `toSupplierContext()`
  umbenannt/kommentiert auf das GPA-Modell (Fehlermeldung bei fehlendem
  Organization-Claim spricht jetzt explizit von "GPA-tragendem
  Organization-Claim"); extrahiert zusätzlich `userType` und übernimmt ihn
  unverändert (`claims.userType ?? undefined`) in den Kontext. **Keine**
  Autorisierungslogik wertet `userType` aus — Guard/Repository-Filter
  bleiben ausschließlich nach `supplierId` (GPA) scopend, wie von ADR 0008
  explizit gefordert.
- Bewusst **nicht** umbenannt: das Feld `organizationId` in
  `VerifiedTokenClaims` sowie der Fehlerreason `missing_organization_claim`
  bleiben technisch benannt (sie beschreiben weiterhin den ZITADEL-
  Organization-Claim-Mechanismus selbst) — nur die Dokumentation/Kommentare
  wurden um die fachliche GPA-Bedeutung ergänzt, wie in der Aufgabenstellung
  gefordert ("Benennung/Kommentare müssen das GPA-Konzept widerspiegeln",
  nicht zwingend jede Variable umbenennen).

**Tests (`apps/api`):**

- `apps/api/src/auth/auth-guard.service.spec.ts`: neue Tests für
  `userType`-Extraktion bei bekanntem Wert, `userType === undefined` bei
  unbekanntem/fehlendem Claim (kein Fehlerfall), sowie einen Test für AC4
  (zwei unterschiedliche `userType`-Anmeldungen derselben GPA erhalten
  identische `supplierId`, unterschiedlichen `userType`, keine
  Vermischung). Bestehender Test für fehlenden Organization-Claim
  umbenannt/kommentiert auf GPA-Sprache, Verhalten unverändert.
- `apps/api/test/contracts.e2e-spec.ts`: `tokenFor()`-Helper um optionalen
  `userType`-Parameter erweitert; neuer Test deckt AC4 auf HTTP-Ebene ab
  (Lieferant- und Steuerberater-Anmeldung derselben synthetischen GPA
  sehen identische, korrekt gescopte Kontraktmenge). Der bereits
  bestehende Mandantentrennungstest (Lieferant A kann Kontrakt von
  Lieferant B nicht lesen, AC von `lieferant-kontrakte-einsehen`) bleibt
  inhaltlich unverändert gültig — er nutzt weiterhin `org_id` als
  Token-Claim, der jetzt lediglich fachlich als GPA zu verstehen ist,
  keine Code-Änderung an der Erwartung selbst nötig.

**`apps/web` — Login-Einstiegspunkt:**

- `apps/web/src/auth/auth-client.ts`: `loginWithZitadel()` von einer reinen
  `declare function` (kein Laufzeitcode) zu einer echten, aber bewusst
  fehlschlagenden `async function` geändert, die einen klar beschrifteten
  Fehler wirft ("es fehlt weiterhin eine echte OIDC-Client-SDK-Integration
  mit PKCE"). **Abweichung von der ADR-0004-Implementierungsnotiz**, die
  explizit `declare function` vorsah, um zu markieren, dass kein SDK
  existiert: Diese Story benötigt einen tatsächlich aufrufbaren,
  testbaren Login-Einstiegspunkt (`LoginPage`); ein `declare function`
  hätte beim Klick zur Laufzeit einen undurchsichtigen
  `TypeError: loginWithZitadel is not a function` erzeugt (da `declare
  function` keinen JS-Code emittiert). Die neue Implementierung ist
  weiterhin **keine funktionierende PKCE-/Krypto-Implementierung** —
  ausschließlich ein ehrlicher, sofort fehlschlagender Platzhalter, der
  im UI sichtbar einen Fehler anzeigt statt einen stillen/falschen Erfolg
  vorzutäuschen. Sobald ein echtes OIDC-SDK (siehe ADR 0004
  "Konsequenzen", Bibliothekswahl offen) integriert wird, ersetzt dessen
  echte Implementierung diesen Funktionskörper 1:1 (Signatur bleibt
  gleich).
- `apps/web/src/auth/LoginPage.tsx` (neu) und `LoginPage.spec.tsx` (neu):
  echte, renderbare React-Komponente analog zur bereits bestehenden
  `ContractsListPage` (Bootstrap-Konvention: Presentational-Komponente,
  die ihre Konfiguration als Prop erhält, kein eigenes
  Env-/Routing-Wiring). Zeigt eine "Anmelden"-Aktion, die
  `loginWithZitadel(config)` auslöst und einen etwaigen Fehler sichtbar
  macht (`role="alert"`); bewusst **kein** Registrierungs-/Sign-up-Link
  oder -Hinweis (AC6) — durch Test abgesichert
  (`queryByText(/registrieren/i)` etc.). **Nicht** Teil dieser Komponente:
  Routing/Redirect-Verhalten für AC7 (`apps/web` hat weiterhin keine
  Routing-Entscheidung, siehe `App.tsx`), Session-/Token-Ablage nach
  IdP-Rückkehr, Darstellung des Okta-MFA-Schritts selbst (läuft laut
  ADR 0008 Punkt 4 vollständig auf ZITADEL-/Okta-Seite). `LoginPage` ist
  daher **nicht** in `App.tsx` verdrahtet (dort wird weiterhin nur
  `ContractsListPage` mit Demo-Daten gerendert) — eine echte Verdrahtung
  setzt die in ADR 0004 als offen markierte Routing-/State-Entscheidung
  voraus und würde sonst eine Architekturfrage im Alleingang beantworten.

**`apps/mobile` — bewusst nicht erweitert:**

- `apps/mobile/src/auth/*` bleibt unverändert (weiterhin `declare
  function loginWithZitadel`, kein Login-Screen). Grund: Laut
  Aufgabenstellung soll bei fehlendem sinnvollen Scope für eine
  vollständige Mobile-Umsetzung dokumentiert statt unfertiger/nicht
  kompilierender Code hinterlassen werden. Eine `LoginScreen`-Komponente
  hätte entweder (a) dieselbe `declare function`-Falle wie ursprünglich in
  `apps/web` reproduziert (nicht aufrufbar) oder (b) eine Änderung an
  `apps/mobile/src/auth/auth-client.ts` erfordert, die über den in der
  Aufgabenstellung explizit auf `apps/web` beschränkten UI-Auftrag
  hinausgeht. Fehlend für Mobile (Stand dieser Story): echter Login-Screen,
  `expo-auth-session`-Integration, sichere Token-Ablage
  (`expo-secure-store`) — alles bereits in ADR 0004 als offen dokumentiert
  und durch diese Story nicht aufgelöst.

**Kein Self-Signup (AC6):** Repository-weite Prüfung (`grep` über
`apps/web`, `apps/mobile`, `apps/api`) ergab **keine** bestehende
Registrierungs-/Sign-up-UI oder -Endpunkt — es gab nichts zu entfernen.
Dokumentiert hier, um einen "erfundenen Fehlen-Test" zu vermeiden, wie in
der Aufgabenstellung gefordert.

**Nicht umgesetzt / bewusst außerhalb des Scopes** (konsistent mit ADR
0008 "Explizit offen gelassen" und den Nicht-Zielen der Story):

- Kein echtes Okta-/ZITADEL-Identity-Brokering-Setup (reine
  Konfigurationsaufgabe außerhalb von `apps/*`, siehe ADR 0008 Punkt 4).
- Keine Berechtigungs-/Sichtbarkeitsunterscheidung nach `userType` — wie
  von ADR 0008 explizit gefordert, hat `userType` in diesem Code
  ausschließlich Transport-, keine Autorisierungswirkung.
- Kein Logout-Flow (AC9) — analog zu ADR 0004 war Session-/
  Token-Lebenszyklus-Management nie Teil des bisherigen Konturwurfs und
  wird hier nicht im Alleingang nachgeholt, da das eine über diese Story
  hinausgehende Session-Architekturfrage berührt (Token-Invalidierung,
  ZITADEL End-Session-Endpoint), die ADR 0004/0008 nicht spezifizieren.
- Kein Mapping/Reconciliation zwischen alter ERP-Kennung
  (`supplierExternalId`, ADR 0001) und GPA an der Lobster-Kontrakt-Grenze
  — von ADR 0008 selbst als offenes Risiko benannt, nicht Teil dieser
  Implementierung.

**Verifikation:** `npm run typecheck --workspaces` und `npm test
--workspaces` laufen grün (API: 23 Tests / 3 Suites, Web: 7 Tests /
2 Suites, Mobile: 1 Test / 1 Suite, unverändert gegenüber vorher plus die
oben beschriebenen neuen Fälle).
