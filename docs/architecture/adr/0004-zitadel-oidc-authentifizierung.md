# 0004. ZITADEL Cloud als OIDC-Identity-Provider für Lieferanten-Authentifizierung

## Status
Vorgeschlagen

## Kontext
`docs/architecture/overview.md` listet unter "Offene technische
Entscheidungen" bislang den "Konkreten Authentifizierungsmechanismus für
Lieferanten (Login-Flow, Token- vs. Session-Modell, IdP-Wahl,
Token-Lebensdauer)" als vollständig offen. [ADR 0002](0002-mandantentrennung-kontrakte.md)
setzt für lieferantenscoped Ressourcen (aktuell: Kontrakte) bereits zwingend
voraus, dass `supplierId` "ausschließlich aus dem verifizierten Auth-Kontext"
stammt, klammert aber explizit aus, **wie** dieser Kontext verifiziert wird
("Es wird angenommen, dass beim Login ein Mechanismus existiert ... die
konkrete Login-Implementierung ist nicht Teil dieser ADR").

Der Security-Bericht zur Story "lieferant-kontrakte-einsehen"
(`docs/security/lieferant-kontrakte-einsehen.md`) benennt dies als
kritischen, freigabeblockierenden Befund: `AuthenticatedSupplierContext` sei
"ein reines Vertrauenskonstrukt ohne Herkunftsgarantie" — es existiere kein
Mechanismus, der `supplierId` kryptographisch verifiziert aus einer
serverseitig vertrauenswürdigen Quelle ableitet, statt sie aus
client-kontrollierbaren Eingaben (z. B. einem Header) zu übernehmen.

Der Nutzer hat entschieden: **ZITADEL Cloud (SaaS)** wird als Identity
Provider für die Lieferanten-Authentifizierung eingesetzt. Dies ist eine
vorgegebene Rahmenentscheidung, keine im Rahmen dieser ADR frei getroffene
IdP-Auswahl unter mehreren Alternativen. Gegenstand dieser ADR ist, die
daraus resultierenden Architekturkonsequenzen sauber herzuleiten und
festzuhalten — insbesondere, wie `apps/api` (gemäß [ADR 0003](0003-monorepo-vs-polyrepo.md)
das gemeinsame Backend für sowohl `apps/web` als auch `apps/mobile`) den von
ZITADEL ausgestellten Token verifiziert, und wie sich das strikte
Mandantenmodell aus ADR 0002 ("ein Lieferant = ein Tenant") in ZITADEL
abbildet.

Relevante Eigenschaften von ZITADEL, die die vorgegebene Wahl fachlich
plausibel machen (keine Neubewertung der Wahl selbst, sondern Einordnung,
warum sie zu den Anforderungen passt):
- ZITADEL implementiert OIDC/OAuth2 als Standardprotokoll — kompatibel mit
  Standard-Bibliotheken sowohl in NestJS (`apps/api`) als auch in React
  (`apps/web`) und React Native/Expo (`apps/mobile`).
- ZITADEL bietet ein natives Konzept von **Organizations** (Mandanten
  innerhalb eines ZITADEL-Instanz-/Projekt-Kontexts) — passend zu einem
  B2B-Extranet-Szenario mit vielen externen Lieferanten-Mandanten statt
  eines einzelnen internen Mitarbeiter-Verzeichnisses.
- ZITADEL unterstützt B2B-Login-Szenarien (organisationsspezifische Logins,
  externe Nutzerverwaltung je Organisation) — passend zum Anwendungsfall
  "externer Lieferant meldet sich am Extranet an", im Gegensatz zu reinen
  Consumer-IdP-Lösungen.

## Entscheidung

### 1. IdP-Wahl
ZITADEL Cloud (SaaS, gehostet von ZITADEL) wird als OIDC-Provider für den
Lieferanten-Login eingesetzt. `apps/api`, `apps/web` und `apps/mobile`
implementieren gegen ZITADEL ausschließlich Standard-OIDC/OAuth2 — kein
ZITADEL-proprietäres Protokoll wird als Kernmechanismus vorausgesetzt. Das
hält eine spätere Migration auf einen anderen OIDC-konformen Provider
technisch möglich, auch wenn sie aktuell nicht geplant ist.

### 2. Token-Modell: Verifikation in `apps/api` und Aufbau von `AuthenticatedSupplierContext`
Es wird ein **tokenbasiertes Modell** entschieden (kein serverseitiger
Session-Store in `apps/api`):

- `apps/web` und `apps/mobile` führen den OIDC-Login-Flow gegen ZITADEL
  durch (Authorization Code Flow mit PKCE — Standard für Public Clients wie
  SPA und native Mobile-Apps; beide Frontend-Typen benötigen denselben
  Flow-Typ, siehe Konsequenzen). Ergebnis ist ein von ZITADEL signiertes
  **ID-Token/Access-Token (JWT)**.
- Beide Frontends senden dieses Token bei jedem Request an `apps/api` als
  `Authorization: Bearer <token>`-Header — konsistent mit ADR 0002, das
  bereits voraussetzt, dass die Supplier-Identität aus einem "verifizierten
  Auth-Kontext" und nicht aus Client-Eingaben wie einem eigenen Header
  stammt.
- `apps/api` verifiziert jedes eingehende Token **serverseitig** gegen den
  öffentlichen JWKS-Endpoint der ZITADEL-Instanz (Standard-JWT-Signatur-
  prüfung: Issuer, Audience, Ablaufzeit, Signatur gegen den von ZITADEL
  bereitgestellten öffentlichen Schlüssel). `apps/api` vertraut dabei
  ausschließlich der kryptographischen Signaturprüfung — niemals einem vom
  Client mitgesendeten, unsignierten Feld.
- Ein Guard in `apps/api` (Fortführung des in ADR 0002 skizzierten
  Guard-Musters) führt diese Verifikation vor jedem lieferantenscoped
  Endpunkt durch und baut daraus den `AuthenticatedSupplierContext` auf.
  Damit erhält dieser Typ erstmals die in Security-Befund genannte
  "Herkunftsgarantie": `supplierId` wird ausschließlich aus einem
  kryptographisch geprüften Claim eines ZITADEL-signierten Tokens gelesen
  (siehe Punkt 3 zum Mapping), nie aus Pfad-, Query- oder Body-Daten oder
  einem beliebigen Header.
- Kein serverseitiger Session-Store wird für den Regelfall eingeführt;
  `apps/api` bleibt zustandslos bezüglich der Authentifizierung
  (State liegt im signierten Token, nicht in `apps/api`-eigener
  Persistenz). Das passt zu einem gemeinsamen Backend für zwei
  unterschiedliche Client-Typen (Web, Mobile), da beide denselben
  zustandslosen Verifikationspfad nutzen können, ohne dass `apps/api`
  client-spezifische Session-Mechanismen (Cookie vs. Secure-Storage auf
  Mobile) unterscheiden müsste.

### 3. Mandantenmodell: Abbildung von "ein Lieferant = ein Mandant" in ZITADEL
Es wird entschieden: **eine ZITADEL Organization pro Lieferant.**

- Jeder Lieferant wird in ZITADEL als eigene Organization angelegt; die
  Lieferanten-Nutzer (Personen, die sich für diesen Lieferanten anmelden)
  werden dieser Organization zugeordnet.
- `apps/api` leitet `supplierId` aus einem Claim ab, der die
  ZITADEL-Organization-Zugehörigkeit des Tokens eindeutig referenziert
  (z. B. die von ZITADEL im Token mitgeführte Organisations-ID). Das
  konkrete Mapping (1:1 Identität von ZITADEL-Organization-ID und interner
  `supplierId`, oder ein separates Mapping-Feld in der `Supplier`-Entität,
  das eine ZITADEL-Organization-ID auf eine interne `supplierId`
  abbildet) wird **nicht** in dieser ADR final spezifiziert, sondern als
  offene Implementierungsdetail-Frage markiert (siehe "Offene Annahmen").
  Grund: Das erfordert Kenntnis, ob `supplierId` bereits als stabiler
  interner Schlüssel aus dem ERP/Lobster existiert (siehe ADR 0001) und
  wie er mit einer ZITADEL-Organization erstmalig verknüpft wird
  (Provisionierungsprozess) — das ist ERP-seitiges/Onboarding-Detail, das
  außerhalb des aktuellen Story-Scopes liegt.
- Diese 1-Organization-pro-Lieferant-Abbildung wurde gewählt (statt z. B.
  eines einzelnen gemeinsamen Custom-Claims/Attributs ohne
  Organisationstrennung), weil sie die in ADR 0002 geforderte strikte
  Mandantentrennung bereits auf IdP-Ebene abbildet und nicht ausschließlich
  auf eine korrekte Implementierung in `apps/api` angewiesen ist
  (Defense-in-Depth, konsistent mit dem in ADR 0002 etablierten Prinzip
  "Guard + Repository-Filter" — hier zusätzlich "IdP-Organisationstrennung
  + Guard + Repository-Filter").
- **Wichtige Klarstellung, kein Widerspruch zu ADR 0002:** Die
  ZITADEL-Organization-Trennung ersetzt **nicht** die in ADR 0002
  entschiedene serverseitige Repository-Filterung nach `supplierId`. Sie
  ist eine zusätzliche Schutzschicht auf IdP-Ebene, kein Ersatz. `apps/api`
  muss weiterhin jede Datenzugriffsebene nach der aus dem Token abgeleiteten
  `supplierId` filtern.

### 4. DSGVO/Datenresidenz — harte Voraussetzung vor Produktivbetrieb
ZITADEL Cloud ist ein externer SaaS-Dienst, der Identitätsdaten von
Lieferanten (mindestens: Nutzer-Stammdaten wie Name, E-Mail, Organisations-
zugehörigkeit) verarbeitet und speichert. Laut Domain-Glossar ist
**Lieferant** (`Supplier`) Stammdaten-sensibel/personenbezogen. Damit ist
ZITADEL Cloud eine zusätzliche externe Auftragsverarbeitungsstelle für
personenbezogene Daten, vergleichbar mit der bereits als Systemgrenze
behandelten ERP/Lobster-Anbindung, aber vertraglich/rechtlich unabhängig
davon zu behandeln.

Diese ADR trifft an dieser Stelle **bewusst keine Schein-Entscheidung**,
sondern hält als harte, vor Produktivbetrieb zu klärende Voraussetzung fest:

- **Datenresidenz muss explizit auf eine EU-Region konfiguriert werden.**
  ZITADEL Cloud bietet nach aktuellem Kenntnisstand regionale
  Instanz-Konfiguration an; welche Region tatsächlich für dieses Projekt
  vertraglich zugesichert und technisch konfiguriert wird, ist zum
  Zeitpunkt dieser ADR **nicht verifiziert** und wird hier nicht
  spekulativ angenommen.
- **Ein Auftragsverarbeitungsvertrag (AVV/DPA) mit ZITADEL muss vor
  Produktivbetrieb abgeschlossen sein.** Das ist eine rechtliche/
  organisatorische Voraussetzung, keine technische Aufgabe von
  Architect/Developer, und wird hier ausschließlich als Blocker
  dokumentiert, nicht selbst herbeigeführt.
- Diese ADR gilt für die Zwecke der technischen Architektur als
  "Vorgeschlagen" nutzbar (Entwicklung/Staging gegen ZITADEL Cloud kann
  beginnen), aber **nicht als Freigabe für Produktivbetrieb mit echten
  Lieferantendaten**, solange Region und AVV nicht geklärt sind. Security
  und DevOps müssen dies vor einem produktiven Rollout gesondert
  bestätigen.

## Konsequenzen
- `apps/api` erhält eine neue Abhängigkeit auf einen externen OIDC-Provider
  (ZITADEL Cloud) für jede Anfrageverifikation lieferantenscoped Endpunkte.
  Fällt ZITADEL Cloud aus oder ist der JWKS-Endpoint nicht erreichbar,
  können neue Token nicht verifiziert werden — dieses Verfügbarkeitsrisiko
  ist Teil der bewussten SaaS-IdP-Entscheidung und liegt außerhalb des
  Scopes dieser ADR (kein Caching-/Fallback-Konzept wird hier festgelegt).
- Sowohl `apps/web` als auch `apps/mobile` benötigen eine
  OIDC-Client-Integration mit PKCE. Die konkrete Bibliothekswahl (z. B.
  spezifische OIDC-Client-Pakete für React bzw. Expo) wird **nicht** in
  dieser ADR getroffen — das ist eine Umsetzungsdetail-Entscheidung für den
  Developer-Agenten innerhalb des hier vorgegebenen Standardflows.
- Token-Lebensdauer, Refresh-Token-Strategie (z. B. Silent Refresh im Web
  vs. Refresh-Token-Rotation auf Mobile) und die konkrete
  ZITADEL-Projekt-/Applikationskonfiguration (Redirect-URIs,
  Scopes/Claims-Konfiguration) sind **nicht** Gegenstand dieser ADR und
  bleiben offen (siehe Update in `overview.md`).
- Das genaue Mapping ZITADEL-Organization-ID → interne `supplierId` inkl.
  Lieferanten-Onboarding-Prozess (wann/wie wird eine ZITADEL-Organization
  für einen neuen Lieferanten angelegt — manuell, automatisiert über
  ZITADEL-Management-API, gekoppelt an ERP-Stammdatenanlage) ist offen und
  sollte in einer eigenen ADR/Story geklärt werden, sobald Lieferanten-
  Onboarding als Story ansteht. Diese ADR nimmt das bewusst nicht vorweg,
  um keinen unbelegten Prozess zu erfinden.
- Rollen für interne Sachbearbeiter (laut ADR 0002 bereits als Nicht-Ziel
  ausgeklammert) bleiben weiterhin außerhalb des Scopes dieser ADR; ob
  interne Nutzer über dieselbe ZITADEL-Instanz oder ein separates
  Verzeichnis laufen, ist nicht entschieden.
- **Risiko:** Wird der Produktivbetrieb gestartet, bevor Datenresidenz und
  AVV mit ZITADEL geklärt sind, verstößt das gegen die in
  Punkt 4 dokumentierte harte Voraussetzung. Diese ADR macht das explizit
  zu einem Freigabekriterium für Security/DevOps, nicht zu einer stillen
  Annahme.
- Der in ADR 0002 offen gelassene Punkt "IdP-Wahl, Token- vs.
  Session-Modell" ist mit dieser ADR entschieden; der dortige
  Autorisierungs-/Scoping-Teil (Guard + Repository-Filter,
  403-vs-404-Verhalten) bleibt unverändert gültig und wird durch diese ADR
  um eine konkrete, verifizierbare Quelle für `AuthenticatedSupplierContext`
  ergänzt, nicht ersetzt.

## Offene Annahmen
- Die konkrete ZITADEL-Region/Instanz-Konfiguration sowie der Abschluss
  eines AVV sind zum Zeitpunkt dieser ADR **nicht bekannt** und werden
  nicht spekulativ angenommen — als harte Voraussetzung vor
  Produktivbetrieb dokumentiert (siehe Entscheidung Punkt 4).
- Das exakte Mapping ZITADEL-Organization ↔ interne `supplierId` sowie der
  Lieferanten-Onboarding-Prozess in ZITADEL sind offen und nicht Teil
  dieser ADR.
- Token-Lebensdauer und Refresh-Strategie sind offen (siehe
  `overview.md`).
- Es wird angenommen, dass ZITADEL Cloud im gewählten Tarif/Setup
  Organizations sowie Custom-Claims im Token unterstützt, die die
  Organisationszugehörigkeit eindeutig referenzieren — diese Annahme
  basiert auf allgemein bekannten ZITADEL-Kernfunktionen, nicht auf einer
  projektspezifischen Verifikation der konkreten Tarif-/Instanzkonfiguration.

## Datenklassifizierung
- **Lieferant** (`Supplier`): Ja, Stammdaten-sensibel laut Domain-Glossar.
  Durch diese ADR direkt betroffen, da Lieferanten-Identitätsdaten (Name,
  E-Mail, Organisationszugehörigkeit der anmeldenden Nutzer) nun zusätzlich
  bei einem externen SaaS-Anbieter (ZITADEL Cloud) verarbeitet werden —
  daher die harte Datenresidenz-/AVV-Voraussetzung in Punkt 4.
- **Kontrakt** (`Contract`): Ja, kommerziell sensibel laut Domain-Glossar
  (bereits in ADR 0001/0002 klassifiziert) — indirekt betroffen, da der
  Zugriffsschutz auf Kontraktdaten nun auf der hier festgelegten
  Token-Verifikation aufbaut.
- Diese ADR selbst führt keine neuen fachlichen Entitäten ein, sondern
  etabliert den technischen Verifikationsmechanismus für bereits
  klassifizierte, mandantengebundene Entitäten.

## Implementierungsnotizen

Analog zum bestehenden Kontrakte-Konturwurf (siehe
`docs/backlog/lieferant-kontrakte-einsehen.md`) wurde diese ADR als
framework-unabhängiger TypeScript-Konturwurf umgesetzt, **kein**
lauffähiges Backend/Frontend. Es existiert weiterhin kein `package.json`
und keine echten Dependencies (ADR 0003 ist dazu weiterhin offen).

**Gebaut:**
- `apps/api/src/auth/zitadel-token.types.ts` — `RawZitadelTokenPayload`
  (unverifizierte JWT-Claims wie von ZITADEL erwartet, inkl. zweier
  plausibler Platzhalter-Claim-Namen für die Organization-Zugehörigkeit)
  und `VerifiedTokenClaims` (normalisierte Claims nach Signaturprüfung,
  vor Policy-Prüfung).
- `apps/api/src/auth/token-verifier.interface.ts` — `TokenVerifier`-
  Interface (`verify(rawToken): Promise<VerifiedTokenClaims>`) als reiner
  Vertrag für die JWKS-Signaturprüfung, plus `TokenVerificationError` als
  definierter Fehlerfall (kein stiller Fallback). Ausdrücklich als
  Platzhalter markiert: eine echte Implementierung würde `jose` oder
  `jwks-rsa` gegen den ZITADEL-JWKS-Endpoint nutzen, sobald ein
  Paketmanager/Dependency-Setup entschieden ist.
- `apps/api/src/auth/auth-guard.service.ts` — `AuthGuardService.authenticate()`
  extrahiert den Bearer-Token, ruft `TokenVerifier.verify()` auf und prüft
  danach separat Ablaufzeit, Issuer und Audience (Platzhalter-Prüfung
  gegen `AuthGuardConfig`). Baut daraus `AuthenticatedSupplierContext`
  (`../contracts/contract.types.ts`) via Mapping `organizationId ->
  supplierId`. Jeder Fehlerfall (fehlendes Token, ungültige/abgelaufene
  Signatur, Issuer-/Audience-Mismatch, fehlender Organization-Claim) wirft
  eine definierte `AuthenticationError` — es gibt keinen Pfad, der
  `AuthenticatedSupplierContext` ohne erfolgreiche Verifikation liefert.
- `apps/api/src/contracts/contracts.controller.ts` (neu) — zeigt, wie
  `ContractsService` (unverändert aus dem bestehenden Prototyp) jetzt
  hinter `AuthGuardService` hängen würde, inkl. Kommentar-Skizze des
  künftigen echten `@Controller()`/`@UseGuards()`-NestJS-Codes. Bildet das
  403/404/401-Statuscode-Mapping aus ADR 0002 Punkt 4 sowie den neuen
  401-Fall bei fehlgeschlagener Authentifizierung ab.
- `apps/web/src/auth/oidc-config.types.ts` und `auth-client.ts` sowie
  `apps/mobile/src/auth/oidc-config.types.ts` und `auth-client.ts` —
  jeweils ein `OidcClientConfig`-Typ (issuer, clientId, redirectUri,
  scopes) und eine `withAuthHeader()`-Funktion, die zeigt, wie ein
  Access-Token nach Login als `Authorization: Bearer`-Header an
  `apps/api`-Requests angehängt würde. `loginWithZitadel()` ist bewusst
  nur als `declare function` (Signatur ohne Implementierung) skizziert,
  um zu markieren, dass kein echtes OIDC-SDK eingebunden ist. Mobile
  enthält zusätzlich Kommentare zu `expo-auth-session` als künftig
  naheliegende Bibliothek sowie zu sicherer Token-Ablage
  (`expo-secure-store`) — beides nicht real integriert.

**Bewusst als Platzhalter/offen belassen (keine stillschweigende
Festlegung):**
- Keine echte JWKS-Bibliothek (`jose`/`jwks-rsa`) eingebunden — reine
  Interface-Skizze in `token-verifier.interface.ts`.
- Kein echtes OIDC-Client-SDK in `apps/web`/`apps/mobile` — `auth-client.ts`
  bildet nur die Ziel-Schnittstelle (Session-Typ, Bearer-Header-Anhängung)
  ab, keinen echten PKCE-Ablauf.
- Kein Framework (NestJS/React/Expo) — alle Dateien sind reine
  TypeScript-Interfaces/-Klassen ohne Decorators, Routing oder Build.
- Das konkrete Mapping ZITADEL-Organization-ID → interne `supplierId`
  bleibt laut ADR 0004 Punkt 3 offen; `AuthGuardService` implementiert im
  Konturwurf vereinfachend eine 1:1-Identität
  (`supplierId === organizationId`) und markiert das explizit im
  Code-Kommentar als Annahme des Konturwurfs, nicht als Festlegung dieser
  ADR-Frage. Ein separates Mapping-Feld in einer künftigen
  `Supplier`-Entität würde stattdessen einen Lookup an dieser Stelle
  erfordern.
- Der exakte ZITADEL-Claim-Name für die Organization-Zugehörigkeit ist in
  `zitadel-token.types.ts` als Platzhalter mit zwei plausiblen Varianten
  benannt — muss beim realen ZITADEL-Projekt-Setup verifiziert werden.
- Reale ZITADEL-Projekt-/Applikationskonfiguration, Stand heute:
  - Instanz/Issuer: `https://supplier-janwkz.eu1.zitadel.cloud` (Region
    `eu1` — deckt den EU-Datenresidenz-Teil der harten Voraussetzung aus
    Entscheidungspunkt 4 ab; der separat nötige Auftragsverarbeitungsvertrag
    (AVV/DPA) mit ZITADEL ist davon unberührt weiterhin ungeklärt).
  - ZITADEL-Projekt-ID: `384797730033190919`.
  - Applikation "Web" (`apps/web`): App-ID `384798128626223111`,
    OIDC-Client-ID `384798128626288647`. Beides sind bei ZITADEL
    öffentliche, nicht-geheime Kennungen (Public Client mit PKCE, siehe
    Entscheidungspunkt 1 — kein Client-Secret nötig/vorhanden).
  - Applikation für `apps/mobile` (Native-App) sowie Redirect-URIs,
    Scopes/Claims-Konfiguration und die Organization-Provisionierung für
    Lieferanten sind weiterhin nicht eingerichtet/dokumentiert — bleiben
    laut ADR 0004 "Offene Annahmen" offen.
  - Diese Werte sind reine Konfiguration, keine ADR-Entscheidung, und
    gehören perspektivisch in eine Umgebungskonfiguration (z. B.
    `.env`/Secrets-Management), sobald ein Framework/Dependency-Setup
    existiert (siehe ADR 0003) — hier nur dokumentiert, damit sie nicht
    verloren gehen.
- Token-Lebensdauer und Refresh-Strategie bleiben unverändert offen (siehe
  ADR-Konsequenzen).
