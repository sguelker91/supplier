# 8. GPA als Mandanten-Schlüssel, Mehrfachanmeldungen pro GPA und Okta als föderierter MFA-Provider

## Status
Vorgeschlagen

## Kontext

Die Backlog-Story
[`lieferanten-anmeldung-gpa`](../../backlog/lieferanten-anmeldung-gpa.md)
("Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA")
erweitert das in [ADR 0004](0004-zitadel-oidc-authentifizierung.md)
festgelegte Authentifizierungsmodell um drei fachliche Änderungen:

1. Die Stammdatenquelle für Lieferanten wechselt auf SAP; Lieferanten werden
   künftig über eine **Geschäftspartnernummer (GPA)** identifiziert statt
   über die bisher angenommene ERP-eigene Kennung.
2. Auf eine einzelne GPA können künftig **mehrere unterschiedliche
   Anmeldungen** existieren (Lieferant selbst, Gastbenutzer, Spedition,
   Steuerberater) — nicht mehr das bisher implizit angenommene Modell "ein
   Lieferant = eine Anmeldung".
3. Die Multi-Faktor-Authentifizierung erfolgt über **Okta**; es gibt
   ausschließlich Login, **kein Self-Signup**.

[ADR 0004](0004-zitadel-oidc-authentifizierung.md) ist zum jetzigen
Zeitpunkt weiterhin im Status "Vorgeschlagen" und bleibt in ihren
Kernentscheidungen (IdP-Wahl ZITADEL Cloud, tokenbasiertes Modell,
JWT-Verifikation ausschließlich gegen ZITADEL in `apps/api`) unverändert
gültig — diese Story widerspricht ihr nicht, sondern **erweitert** sie um
Aspekte, die dort explizit offengelassen wurden (das exakte Mapping
ZITADEL-Organization ↔ interne `supplierId`, siehe ADR 0004 Punkt 3 und
"Offene Annahmen"). Analog zu dem Muster, nach dem
[ADR 0002](0002-mandantentrennung-kontrakte.md) durch ADR 0004 ergänzt statt
bearbeitet/ersetzt wurde, wird auch hier **keine bestehende ADR editiert**,
sondern diese neue ADR 8 knüpft an ADR 0004 an, präzisiert sie an den dort
offengelassenen Stellen und erweitert sie um die neuen fachlichen
Anforderungen. ADR 0004 bleibt als Dokument unverändert bestehen.

[ADR 0002](0002-mandantentrennung-kontrakte.md) setzt voraus, dass
`supplierId` "ausschließlich aus dem verifizierten Auth-Kontext" stammt.
[ADR 0001](0001-lobster-kontrakt-datenkontrakt-und-sync-status.md) definiert
für Kontraktdaten aus der Lobster-Grenze bereits ein Feld
`supplierExternalId` als "ERP-seitige Lieferantenkennung" — diese Annahme
wird durch den GPA-Wechsel berührt (siehe Konsequenzen/Risiken).

Bündelung in einer ADR: Die vier Entscheidungspunkte dieser Story (Schlüssel,
Mehrfachanmeldung, Self-Signup, Okta-Brokering) hängen technisch eng
zusammen (alle betreffen denselben Login-Flow und denselben
`AuthenticatedSupplierContext`) und werden — konsistent mit der Struktur von
ADR 0004, die ebenfalls mehrere zusammenhängende Punkte in einer ADR
gebündelt hat — hier gemeinsam entschieden, statt in vier separate
Einzel-ADRs aufgeteilt zu werden.

## Entscheidung

### 1. GPA wird der Mandanten-Schlüssel in `AuthenticatedSupplierContext`

Es wird entschieden: Die **Geschäftspartnernummer (GPA)** ist künftig der
fachliche Schlüssel, der als `supplierId` im verifizierten
`AuthenticatedSupplierContext` (ADR 0002/ADR 0004) geführt wird — nicht eine
separate interne, von der GPA verschiedene Kennung mit der GPA nur als
zusätzlichem Attribut. Das ist keine Scheinentscheidung, sondern zwingend
durch AC5 der Story gefordert ("intern ausschließlich die GPA ... aus dem
verifizierten Auth-Kontext verwendet — nicht die bisherige ERP-eigene
Kennung").

Konkret:

- Die 1-Organization-pro-Mandant-Abbildung aus ADR 0004 Punkt 3 bleibt
  bestehen, wird aber präzisiert: **eine ZITADEL Organization pro GPA**
  (statt der bisher unspezifischen Formulierung "pro Lieferant"). Der
  Claim, den `apps/api` aus dem Token liest, um die
  Organisationszugehörigkeit zu bestimmen, referenziert damit
  wirtschaftlich die GPA.
- `AuthGuardService` (siehe ADR 0004, Implementierungsnotizen) leitet
  `AuthenticatedSupplierContext.supplierId` künftig aus diesem
  GPA-tragenden Organization-Claim ab. Der in ADR 0004 als Platzhalter
  implementierte 1:1-Kurzschluss `supplierId === organizationId` wird damit
  fachlich präzisiert zu: `supplierId === GPA` (die ZITADEL-Organization-ID
  selbst kann technisch weiterhin identisch mit der GPA sein oder die GPA
  als Organisations-Metadatum/-Namen tragen — das exakte
  ZITADEL-Provisionierungsdetail bleibt, wie schon in ADR 0004, offen und
  ist ein SAP-/ZITADEL-Onboarding-Detail außerhalb dieses Scopes).
- Ob die interne `Supplier`-Entität in `apps/api` zusätzlich einen eigenen,
  von der GPA verschiedenen technischen Primärschlüssel (z. B. eine
  Datenbank-UUID) führt, wird durch diese ADR **nicht** vorgeschrieben —
  das ist ein normales Persistenz-Implementierungsdetail. Architektonisch
  verbindlich ist nur: Der für Mandantentrennung, Guard-Prüfung und
  Repository-Filterung (ADR 0002) verwendete fachliche Schlüsselwert ist
  die GPA, nicht die bisherige ERP-eigene Kennung.
- Die SAP-interne Vergabe/Formatierung der GPA selbst wird hier **nicht**
  spezifiziert — das ist Lobster/ERP-Systemgrenzen-Detail (siehe ADR 0001)
  und liegt außerhalb dieses Scopes.

### 2. Mehrfachanmeldungen pro GPA und Nutzertyp als mitgeführtes Attribut

Das bisher implizit angenommene Modell "eine ZITADEL Organization = genau
ein anmeldender Nutzer" wird explizit zu **"eine ZITADEL Organization (=
eine GPA) kann mehrere ZITADEL-Nutzer/Anmeldungen enthalten"** erweitert.
Das ist keine strukturelle Änderung an ZITADEL selbst (ZITADEL-Organizations
unterstützen nativ mehrere Nutzer), sondern eine explizite Festlegung, dass
diese ohnehin vorhandene Fähigkeit für dieses Feature genutzt wird:

- Lieferant, Gastbenutzer, Spedition und Steuerberater werden als jeweils
  eigene ZITADEL-Nutzer innerhalb derselben GPA-Organization angelegt
  (Provisionierung selbst ist laut Story-Scope nicht Teil dieser ADR, siehe
  "Offene Annahmen").
- Jede Anmeldung erzeugt ihr eigenes, für diesen Nutzer individuelles Token
  (eigener `sub`-Claim), das denselben Organization-/GPA-Claim trägt. Die
  in AC4 geforderte Trennung von Sitzungen unterschiedlicher Anmeldungen
  derselben GPA ergibt sich damit unmittelbar aus dem bereits in ADR 0004
  Punkt 2 entschiedenen zustandslosen, tokenbasierten Modell (jedes Token
  ist einem einzelnen Nutzer zugeordnet) — es ist **keine** zusätzliche
  Session-Store-Logik in `apps/api` erforderlich.
- Neu eingeführt wird ein **Nutzertyp-Attribut** (`userType`, Werte
  entsprechend Lieferant/Gastbenutzer/Spedition/Steuerberater — exakte
  Enum-Bezeichner sind Umsetzungsdetail des Developer-Agenten), das als
  zusätzlicher Claim/Nutzer-Metadatum in ZITADEL geführt und von
  `AuthGuardService` beim Aufbau von `AuthenticatedSupplierContext`
  zusätzlich zu `supplierId` extrahiert wird (z. B. als neues Feld
  `userType` auf `AuthenticatedSupplierContext`).
- **Ausdrücklich außerhalb dieses Scopes:** Es wird **keine**
  Autorisierungs- oder Sichtbarkeitslogik eingeführt, die auf `userType`
  reagiert. Der Guard/Repository-Filter aus ADR 0002 bleibt unverändert
  ausschließlich nach `supplierId` (GPA) scopend; `userType` wird lediglich
  im Auth-Kontext verfügbar gemacht, damit eine künftige, separate
  Berechtigungs-ADR (siehe Nicht-Ziele der Story) nicht erneut die
  Claims-/Token-Verarbeitungsschicht anfassen muss.
- Der exakte ZITADEL-Mechanismus zur Abbildung von `userType` (Custom Role,
  Custom Metadata-Attribut, Claim-Mapping via Actions) wird hier **nicht**
  final spezifiziert — analog zu ADR 0004, die den exakten
  Organization-Claim-Namen ebenfalls offengelassen hat.

### 3. Kein Self-Signup

- `apps/web` und `apps/mobile` bieten **keine** Registrierungs-/Sign-up-UI
  an; `apps/api` erhält **keinen** Registrierungs-/Signup-Endpunkt. Das war
  bereits vorher implizit der Fall (ADR 0004 hat nie einen solchen Flow
  vorgesehen), wird hier aber als explizite architektonische
  Randbedingung festgehalten, weil AC6 der Story dies erstmals konkret
  fordert.
- Die Selbstregistrierung muss sowohl auf ZITADEL-Seite (Organization-
  bzw. Instanz-Einstellung) als auch auf Okta-Seite (Org-/App-Konfiguration
  im Rahmen der Föderation, siehe Punkt 4) deaktiviert sein. Das ist eine
  Konfigurationsmaßnahme (ZITADEL-/Okta-Admin-Einstellung), keine
  Code-Änderung in `apps/*`, und wird hier als Anforderung an das
  Deployment/die Instanzkonfiguration dokumentiert, nicht selbst
  ausgeführt.
- Wie eine neue Anmeldung zu einer GPA provisioniert wird (wer legt einen
  neuen ZITADEL-Nutzer in einer GPA-Organization an), ist laut
  ausdrücklichem Nicht-Ziel der Story **nicht** Teil dieser ADR und bleibt
  offen (siehe "Offene Annahmen").

### 4. Okta als föderierter Identity Provider via Identity Brokering in ZITADEL

Es wird entschieden: **Okta wird als externer Identity Provider in ZITADEL
eingebunden (Identity Brokering / "External IdP"-Feature von ZITADEL).**

- Ablauf: `apps/web`/`apps/mobile` führen unverändert den in ADR 0004
  Punkt 1/2 festgelegten Authorization-Code-Flow mit PKCE **gegen ZITADEL**
  durch. ZITADEL leitet den Nutzer für die eigentliche
  Zugangsdaten-Prüfung und MFA an Okta weiter (Brokering). Nach
  erfolgreicher Okta-Authentifizierung (inkl. MFA) stellt **ZITADEL** —
  nicht Okta — das signierte OIDC-Token aus, das an `apps/web`/`apps/mobile`
  zurückgegeben wird.
- `apps/api` verifiziert weiterhin **ausschließlich** ZITADEL-ausgestellte
  Token gegen den ZITADEL-JWKS-Endpoint (ADR 0004 Punkt 2 bleibt dadurch
  vollständig unverändert gültig). `apps/api` hat keine Kenntnis von Okta
  und verifiziert zu keinem Zeitpunkt ein Okta-Token direkt.
- `apps/web`/`apps/mobile` benötigen ebenfalls **keine** Okta-spezifische
  Integration — aus Client-Sicht bleibt der Login-Flow ein reiner
  OIDC-Flow gegen ZITADEL; Okta ist vollständig hinter ZITADEL verborgen.
- Diese Entscheidung übernimmt damit formal die in der Backlog-Story als
  "naheliegende technische Lösung" bezeichnete Option, macht sie zur
  getroffenen Architekturentscheidung.

**Explizit offen gelassen (keine Spekulation):**

- Ob die Föderation zwischen ZITADEL und Okta über OIDC oder SAML erfolgt.
- Die exakten Claim-/Attribut-Mappings zwischen Okta und ZITADEL.
- Wie genau Oktas Login-Oberfläche AC3 umsetzt (Ablehnung ungültiger
  Zugangsdaten mit generischer Fehlermeldung, **bevor** MFA angefordert
  wird, zum Schutz gegen Enumeration). Das ist Verhalten der
  Okta-Login-UI/-Policy-Konfiguration, nicht dieser Architektur selbst
  zugänglich — wird hier als **zu verifizierende Annahme** markiert, nicht
  als garantierte Eigenschaft dieser Entscheidung.

### 5. DSGVO/Datenklassifizierung — Okta als zusätzlicher Auftragsverarbeiter

Analog zu ADR 0004 Punkt 4 gilt: Durch die Föderation wird **Okta zu einem
weiteren externen SaaS-Auftragsverarbeiter** für personenbezogene
Lieferanten-Identitätsdaten (Zugangsdaten-Prüfung, MFA-Faktoren, ggf.
propagierte Attribute wie Name/E-Mail), zusätzlich zu ZITADEL Cloud.

Diese ADR trifft hier **bewusst keine Schein-Entscheidung**, sondern hält
als harte, vor Produktivbetrieb zu klärende Voraussetzung fest — identisch
im Charakter zu ADR 0004 Punkt 4:

- **Datenresidenz für den genutzten Okta-Tenant/-Org muss explizit auf eine
  EU-Region geklärt/konfiguriert werden.** Zum Zeitpunkt dieser ADR nicht
  verifiziert, wird hier nicht spekulativ angenommen.
- **Ein Auftragsverarbeitungsvertrag (AVV/DPA) mit Okta muss vor
  Produktivbetrieb abgeschlossen sein**, zusätzlich zum bereits für ZITADEL
  geforderten AVV. Rechtliche/organisatorische Voraussetzung, keine
  technische Aufgabe von Architect/Developer.
- Login-/MFA-Ereignisse (Zeitpunkt, Erfolg/Fehlschlag, betroffene
  Anmeldung/GPA) sind personenbezogene Daten mit Relevanz für die
  DSGVO-Rechenschaftspflicht (Audit-Logging). Diese ADR entscheidet
  **kein** Audit-Log-Konzept — das bleibt, wie in den Offenen Fragen der
  Story vermerkt, eine eigene Folge-Entscheidung von Architect/Security.
- Wie in ADR 0004: Diese ADR gilt für Entwicklung/Staging als nutzbar, ist
  aber **keine Freigabe für Produktivbetrieb mit echten Lieferantendaten**,
  solange Region und AVV (für Okta **und** weiterhin für ZITADEL) nicht
  geklärt sind.

## Konsequenzen

- **Risiko — Schlüssel-Bruch an der Lobster-Grenze:** ADR 0001 definiert
  für aus Lobster einlaufende Kontraktdaten ein Feld `supplierExternalId`
  als "ERP-seitige Lieferantenkennung". Wird `supplierId` im
  `AuthenticatedSupplierContext` künftig aus der GPA gebildet (siehe Punkt
  1), entsteht ein potenzieller Bruch zwischen dem Schlüssel, mit dem
  Kontrakte importiert werden (`supplierExternalId`, alte ERP-Kennung) und
  dem Schlüssel, mit dem der Guard/Repository-Filter aus ADR 0002 nach
  Kontrakten filtert (GPA-basierte `supplierId`). Diese ADR löst dieses
  Mapping **nicht** auf — das ist laut Nicht-Ziel der Story ("keine
  Migration bestehender Lieferanten-Konten/-Kennungen") explizit nicht
  Teil dieses Scopes, wird hier aber als konkreter technischer
  Anschlussbedarf benannt: Vor oder mit der Kontrakt-Ingestion muss geklärt
  werden, ob Lobster/SAP künftig direkt die GPA als
  `supplierExternalId`-Äquivalent liefert, oder ob `apps/api` ein
  Mapping alte-ERP-Kennung ↔ GPA vorhalten muss.
- `AuthGuardService` (ADR 0004, Implementierungsnotizen) muss um die
  Extraktion des `userType`-Claims sowie die Präzisierung des
  GPA-Organization-Claims erweitert werden — reiner
  Umsetzungs-/Folgeaufwand, keine neue Architekturentscheidung.
- ZITADEL- und Okta-seitige Konfigurationsarbeiten (External-IdP-Setup in
  ZITADEL, Deaktivierung der Selbstregistrierung in beiden Systemen) sind
  reine Betriebs-/Konfigurationsaufgaben außerhalb von `apps/*`-Code.
- Ein zweiter externer SaaS-Auftragsverarbeiter (Okta) vergrößert die
  DSGVO-/Vendor-Risikofläche gegenüber ADR 0004 — Security muss dies bei
  der Bewertung dieser Story gesondert berücksichtigen.
- **Explizit kein Berechtigungsmodell:** Diese ADR führt `userType` nur als
  Datenfeld ein, **keine** Sichtbarkeits-/Berechtigungsunterscheidung. Bis
  eine eigene Folge-ADR/Story das regelt, haben alle Anmeldungen einer GPA
  über den bestehenden Guard/Repository-Filter (ADR 0002) identischen
  Zugriff auf lieferantenscoped Ressourcen dieser GPA. Das ist eine
  bewusste, im Backlog als Nicht-Ziel benannte Scope-Grenze, keine
  übersehene Lücke.
- **Nicht abgedeckt:** Eine einzelne Anmeldung, die mehreren GPA zugeordnet
  ist (z. B. ein Steuerberater mit mehreren Mandanten). Das Datenmodell
  dieser ADR geht von genau einer GPA pro ZITADEL-Organization und genau
  einer Organization-Zugehörigkeit pro Token aus; ein
  Mandanten-Wechsel-Mechanismus wäre eine grundlegend andere,
  hier nicht entworfene Erweiterung.
- AC3 (generische Fehlermeldung vor MFA, Enumeration-Schutz) hängt von der
  tatsächlichen Okta-Konfiguration ab und kann durch diese Architektur
  allein nicht garantiert werden — muss bei der Okta-Tenant-Einrichtung
  verifiziert werden.

## Offene Annahmen

- Exakter ZITADEL-Claim-/Metadaten-Name für die GPA-Organization-Zuordnung
  sowie für `userType` — offen, analog zu ADR 0004.
- OIDC vs. SAML für die Föderation ZITADEL ↔ Okta, sowie exaktes
  Claim-/Attribut-Mapping — offen.
- Datenresidenz und AVV/DPA für den genutzten Okta-Tenant — offen, harte
  Voraussetzung vor Produktivbetrieb (siehe Entscheidung Punkt 5).
- Provisionierungsprozess für neue Anmeldungen pro GPA (Anlegen,
  Deaktivieren in ZITADEL/Okta) — offen, laut Nicht-Ziel der Story nicht
  Teil dieser ADR.
- Mapping/Reconciliation zwischen der bisherigen ERP-eigenen
  Lieferantenkennung (`supplierExternalId`, ADR 0001) und der neuen
  GPA-basierten `supplierId` an der Lobster-Kontrakt-Grenze — offen (siehe
  Konsequenzen/Risiken).
- Ob `Supplier` in `apps/api` zusätzlich einen von der GPA unabhängigen
  technischen Primärschlüssel führt — als Implementierungsdetail
  offengelassen.
- Audit-Logging-Konzept für Login-/MFA-Ereignisse — offen, eigene
  Folge-Entscheidung von Architect/Security.
- Ob eine einzelne Anmeldung mehreren GPA zugeordnet sein kann — laut
  Backlog explizit nicht Teil dieser Story/ADR.

## Datenklassifizierung

- **Lieferant** (`Supplier`): Ja, Stammdaten-sensibel laut Domain-Glossar.
  Direkt betroffen: Die GPA wird künftig der primäre, personenbezogene
  Identifikationsschlüssel innerhalb des Auth-Kontexts (siehe auch neuer
  Glossar-Eintrag "GPA / Geschäftspartnernummer").
- **Kontrakt** (`Contract`): Ja, kommerziell sensibel laut Domain-Glossar
  (bereits in ADR 0001/0002 klassifiziert) — indirekt betroffen durch das
  in "Konsequenzen" benannte Schlüssel-Mapping-Risiko zwischen
  `supplierExternalId` und GPA-basierter `supplierId`.
- **ERP-System**: Ja, laut Glossar Quelle vieler sensibler Daten — durch
  den Wechsel der Stammdatenquelle auf SAP und die Einführung der GPA
  direkt betroffen (siehe Glossar-Update).
- **Login-/MFA-Ereignisse und Anmeldung↔GPA-Zuordnung** (kein eigener
  Glossar-Eintrag, aber ausdrücklich in der Backlog-Story als
  personenbezogen benannt): Ja, DSGVO-relevant. Betrifft sowohl ZITADEL
  als auch — neu durch diese ADR — Okta als zusätzlichen externen
  Auftragsverarbeiter.
- **Nutzertyp** (`userType`, kein eigener Glossar-Eintrag, neu durch diese
  ADR eingeführtes technisches Attribut): Als Attribut einer personenbezogenen
  Anmeldung ebenfalls DSGVO-relevant zu behandeln, auch wenn er (noch) keine
  Autorisierungswirkung entfaltet.
