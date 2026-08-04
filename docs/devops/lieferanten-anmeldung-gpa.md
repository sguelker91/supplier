# DevOps-Notiz: Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

> **Hinweis zum Reifegrad (wichtig, unterscheidet sich vom vorherigen
> DevOps-Stand):** Anders als bei der Story `lieferant-kontrakte-einsehen`
> existiert für dieses Feature bereits ein echtes, installierbares Monorepo
> **und** eine echte CI-Pipeline (`.github/workflows/ci.yml`, GitHub Actions
> gemäß ADR 0006), die Lint/Typecheck/Test/Build für `apps/api`, `apps/web`,
> `apps/mobile` automatisiert durchführt. **CI (Lint/Typecheck/Test/Build)
> besteht bereits.** Was weiterhin **nicht** existiert und in dieser Notiz
> als **"kein CD vorhanden — Vorschlag"** markiert wird: jegliche
> Deployment-/CD-Pipeline, echte Umgebungen (Dev/Staging/Prod als betriebene
> Infrastruktur), GitHub-Environments/-Secrets-Konfiguration und
> Monitoring-/Log-Aggregations-Infrastruktur. `ci.yml` selbst enthält den
> Kommentar "Kein Deployment/CD -- ausschließlich Lint/Typecheck/Test/Build."
> — das ist weiterhin zutreffend und wird durch diese Story nicht geändert.
>
> Zusätzlich gilt: Laut Security-Bericht
> (`docs/security/lieferanten-anmeldung-gpa.md`) ist das Gesamt-Feature
> "Anmeldung" **"Blockiert für einen Produktivbetrieb"** — u. a. wegen einer
> ungeprüften ZITADEL↔Okta-Föderationsvertrauenskette, eines fehlenden
> Okta-AVV/Datenresidenz-Nachweises und eines fehlenden funktionsfähigen
> Login-/Logout-Flows (drei kritische Befunde). Der QA-Bericht bestätigt
> dieselben funktionalen Lücken (AC1/7/8/9). Diese DevOps-Notiz plant Pipeline/
> Umgebungen/Secrets/Rollout **unter der Annahme**, dass diese Blocker vor
> einem produktiven Rollout behoben werden — sie löst keinen dieser Befunde
> selbst (nicht Aufgabe dieser Rolle) und ersetzt keine der dort geforderten
> Maßnahmen.

## Pipeline-Änderungen

**Bestehender Zustand:** `.github/workflows/ci.yml` führt bereits pro
Workspace (`apps/api`, `apps/web`, `apps/mobile`) `lint`, `typecheck` und
`test` aus (Matrix-Job), gefolgt von einem `build`-Job für `apps/api`/
`apps/web`. Das ist unverändert für dieses Feature ausreichend, aus
folgenden Gründen:

- Die neuen/geänderten Auth-Dateien liegen unter `apps/api/src/auth/*`
  (u. a. `auth-guard.service.ts`, `auth-guard.service.spec.ts`,
  `jose-token-verifier.ts`, `user-type.ts`, `zitadel-token.types.ts`) und
  `apps/web/src/auth/*` (`LoginPage.tsx`, `LoginPage.spec.tsx`,
  `auth-client.ts`). `npm run test --workspace=apps/api` bzw.
  `--workspace=apps/web` (Jest, ADR 0005) discovern `*.spec.ts(x)` bereits
  automatisch im gesamten Workspace — **keine Änderung an `ci.yml` nötig**,
  damit die neuen 23 API-Tests bzw. 7 Web-Tests (siehe QA-Bericht) in CI
  laufen. Das habe ich anhand von `package.json`/`apps/api/package.json`
  verifiziert (`"test": "jest"`, kein manuell gepflegtes Test-Glob).
- **Keine neuen Secrets/Umgebungsvariablen für den CI-Testlauf nötig.**
  ADR 0006 Punkt 3 gilt unverändert: `apps/api`-Tests verifizieren
  ausschließlich gegen `FakeTokenVerifier`
  (`apps/api/src/auth/testing/fake-token-verifier.ts`, selbst-signierte
  Test-Tokens, kein Netzwerkzugriff auf ZITADEL). Das gilt für dieses
  Feature **zusätzlich auch für Okta**: Da laut ADR 0008 Punkt 4 `apps/api`
  zu keinem Zeitpunkt ein Okta-Token verifiziert oder mit Okta spricht
  (Okta ist vollständig hinter ZITADEL verborgen), entsteht durch dieses
  Feature **kein** Bedarf an `OKTA_*`-Secrets im CI-Testlauf — weder heute
  noch nach Einführung eines echten OIDC-SDK, solange die Architekturvorgabe
  (ZITADEL verifiziert, `apps/api` kennt nur ZITADEL) unverändert gilt.
- `apps/web`s aktueller `loginWithZitadel()` wirft bewusst immer einen
  Fehler (kein SDK) — der zugehörige Test prüft genau dieses Verhalten und
  braucht ebenfalls keine echten ZITADEL-/Okta-Endpunkte.
- **Vorschlag für eine künftige Iteration, sobald ein echtes OIDC-SDK
  integriert wird** (nicht jetzt umsetzen, nur vorgemerkt):
  - Ein zusätzlicher Secret-Scanning-Schritt (z. B. Gitleaks) vor dem
    `test`-Job, um versehentliches Einchecken einer Okta-Client-Secret/
    SAML-Metadaten-URL/Zertifikat frühzeitig zu erkennen. Aktuell nicht
    vorhanden, aber sinnvoll, sobald reale Föderationskonfiguration
    irgendwo im Repo referenziert wird (z. B. in `.env.example`-Dateien).
  - Ein manueller/nicht-automatisierter Prüfschritt "Enumeration-Schutz
    (AC3) gegen realen Okta-/ZITADEL-Tenant verifiziert" gehört **nicht**
    in die CI-Pipeline (kann nicht automatisiert gegen einen externen
    SaaS-Tenant in jedem PR getestet werden), sondern in eine
    Staging-Abnahme-Checkliste (siehe Rollout-Plan).
  - `apps/mobile` hat weiterhin keinen produktionsrelevanten Build-Schritt
    in `ci.yml` (Kommentar dort: Expo-Builds laufen über EAS Build, nicht
    Teil dieser CI-Stufe). Sobald ein Mobile-Login-Screen existiert, ändert
    das nichts an `ci.yml` selbst (Test läuft weiterhin über die Matrix),
    wohl aber am EAS-Build-Vorschlag unten (Mobile-Release-Aspekte).

## Umgebungen / Konfiguration

**Kein CD/Umgebungsinfrastruktur vorhanden — Vorschlag.** Es existiert
aktuell keine betriebene Dev-/Staging-/Prod-Umgebung für `apps/api`/
`apps/web`/`apps/mobile`, nur die CI-Pipeline (Lint/Test/Build). Vorschlag
für eine Staffelung, sobald Deployment ansteht — bewusst so sequenziert,
dass Entwicklung/Staging **vor** Klärung der Okta-AVV-/Föderations-Blocker
beginnen kann (ADR 0004/0008 erlauben das für Dev/Staging ausdrücklich),
Produktivbetrieb aber explizit hinter einem Gate steht:

| Umgebung | Zweck | ZITADEL/Okta-Anbindung | Voraussetzung |
|---|---|---|---|
| **Dev** | Lokale Entwicklung, Feature-Branches | ZITADEL Cloud `eu1`-Instanz (Projekt-ID `384797730033190919`, siehe ADR 0004 Implementierungsnotizen), sobald ein echtes OIDC-SDK existiert; bis dahin bleibt `loginWithZitadel()` bewusst nicht lauffähig. Okta-Föderation nur, sobald ein Okta-Test-/Dev-Tenant bereitsteht. | Keine — nutzbar laut ADR 0004/0008 bereits jetzt für Entwicklung. |
| **Staging** | QA-/Security-Abnahme vor Rollout, inkl. der laut Security-Bericht geforderten manuellen Verifikationen | ZITADEL Cloud `eu1` + Okta-**Test-/Sandbox-Tenant** (Föderation via External-IdP-Konfiguration in ZITADEL, siehe ADR 0008 Punkt 4) | Echtes OIDC-SDK (Web **und** Mobile) inkl. PKCE muss integriert sein, sonst ist Staging-Abnahme der eigentlichen ACs (AC1/2/3/8/9) nicht möglich. |
| **Prod** | Echtbetrieb für Lieferanten | ZITADEL Cloud `eu1` + Okta-**Produktiv-Tenant** | **Explizit blockiert**, siehe Produktions-Gate unten. Kein Prod-Deployment dieses Features, unabhängig davon, ob eine CD-Pipeline technisch bereitsteht. |

Wichtige Punkte, sobald reale Deployment-Infrastruktur entsteht:

- Konfigurationswerte, die laut ADR 0004 **öffentlich, nicht-geheim** sind
  (ZITADEL-Issuer-URL, ZITADEL-OIDC-Client-ID für `apps/web`, künftige
  Client-ID für die Native-App `apps/mobile`), sollten als normale
  **Umgebungsvariablen/Build-Konfiguration pro Umgebung** geführt werden
  (z. B. GitHub Environment "Variables", nicht "Secrets") — sie unterliegen
  keinem Geheimhaltungsbedarf, aber weiterhin dem Grundsatz "kein
  Hardcoding im Code", damit Dev/Staging/Prod unterschiedliche
  ZITADEL-Organizations/Redirect-URIs nutzen können, ohne einen
  Code-Branch zu benötigen.
- `apps/web`/`apps/mobile` sprechen laut ADR 0008 Punkt 4 **nie** direkt
  mit Okta — die Umgebungstrennung für Okta betrifft ausschließlich die
  **ZITADEL-seitige External-IdP-Konfiguration** (Admin-Ebene, kein
  `apps/*`-Code, kein Deployment-Artefakt dieses Repos).
- **Produktions-Gate** — vor einem Prod-Deployment prüft/fragt DevOps
  explizit die folgenden, im Security-Bericht als Blocker benannten Punkte
  ab (DevOps entscheidet hier nicht selbst über die fachliche/rechtliche
  Bewertung, sondern verlangt einen dokumentierten Nachweis als
  Freigabevoraussetzung für das Deployment, analog zum bereits für ZITADEL
  in ADR 0004 etablierten Muster):
  1. **Dokumentierter Prüfnachweis der ZITADEL↔Okta-Föderations-
     Vertrauenskette** (Security-Befund "kritisch"): Bestätigung, dass
     Account-Linking zwingend an die GPA-Organisation gebunden ist, nicht
     automatisch über eine ungeprüfte E-Mail-Adresse erfolgt.
  2. **Abgeschlossener AVV/DPA mit Okta sowie dokumentierte EU-Datenresidenz
     für den genutzten Okta-Tenant** (Security-Befund "kritisch",
     DSGVO-Blocker) — zusätzlich zum bereits für ZITADEL geforderten,
     laut ADR 0004 weiterhin offenen AVV.
  3. **Funktionsfähiger Login-/Redirect-/Logout-Flow** (Web **und**
     Mobile), bestätigt durch QA (AC1/AC7/AC8/AC9) — kein Prod-Deployment
     eines Auth-Features ohne funktionierenden Logout-Mechanismus zur
     Token-Invalidierung im Kompromittierungsfall.
  4. **Dokumentierter Konfigurationsnachweis**, dass Selbstregistrierung
     sowohl in der ZITADEL-Organization/-Instanz als auch im Okta-Tenant
     deaktiviert ist (Security-Befund "hoch") — z. B. Export/Screenshot der
     Admin-Konfiguration als Artefakt der Deployment-Checkliste.
  5. **Dokumentiertes Testergebnis** des manuellen AC3-Verifikationstests
     (generische Fehlermeldung vor MFA, Enumeration-Schutz) gegen den
     realen Okta-/ZITADEL-Tenant (Security-Befund "mittel").
  6. **Vorliegendes Audit-Logging-Konzept** für Login-/MFA-Ereignisse
     inkl. Ziel-Infrastruktur (siehe Monitoring-Abschnitt) — DevOps stellt
     hier nur sicher, dass ein Log-Ziel/Retention existiert, sobald
     Architect/Security das Konzept liefern (Security-Befund "mittel").
  7. Für den Fall, dass parallel ein Kontrakt-/Beleg-Ingestion-Adapter
     unter dem GPA-Modell aktiviert werden soll: **geklärte
     GPA/`supplierExternalId`-Mapping-Strategie** (Security-Befund "hoch")
     — kein Deployment eines Ingestion-Adapters, der GPA naiv mit der
     alten ERP-Kennung gleichsetzt.
  - Empfehlung: Diese sieben Punkte als **manuelle Freigabe-Gate**
    (z. B. GitHub Environment "production" mit Required Reviewers) am
    Deployment-Workflow abbilden, sobald ein solcher existiert — nicht als
    automatisierten CI-Check (die meisten Punkte sind organisatorisch/
    vertraglich, nicht code-prüfbar).

## Secrets-Handling

**Kein Secrets-Management-Infrastruktur für dieses Feature vorhanden —
Vorschlag.** Zunächst zur Einordnung, was durch dieses Feature überhaupt an
neuen Konfigurationswerten entsteht:

- **Kein neues echtes Secret durch die ZITADEL-Seite.** Laut ADR 0004
  Implementierungsnotizen sind die ZITADEL-Projekt-/App-/Client-IDs für
  `apps/web` "öffentliche, nicht-geheime Kennungen (Public Client mit
  PKCE ... kein Client-Secret nötig/vorhanden)". Das gilt unverändert auch
  für die künftige Native-App-Registrierung für `apps/mobile`. Diese Werte
  können als normale Umgebungskonfiguration behandelt werden (siehe
  Umgebungen-Abschnitt), **nicht** als Secret im engeren Sinn — aber
  weiterhin nicht hartkodiert, sondern pro Umgebung konfigurierbar.
- **Potenzielles neues echtes Secret durch die Okta-Föderationsseite**,
  abhängig von der laut ADR 0008 noch offenen Entscheidung OIDC vs. SAML:
  - Bei **OIDC-Föderation**: ein Okta-**Client-Secret**, das ZITADEL zur
    Authentifizierung gegenüber Okta beim Brokering benötigt.
  - Bei **SAML-Föderation**: eine Okta-**Metadata-URL** (typischerweise
    kein Geheimnis) sowie ggf. ein SAML-**Signaturzertifikat/-Schlüssel**
    (je nach Konfiguration schützenswert).
  - **Wichtige Besonderheit dieses Features:** Dieses Secret wird —
    anders als z. B. ein klassischer ERP-/Lobster-API-Key — primär **in
    der ZITADEL-Admin-Konfiguration** (External-IdP-Setup) hinterlegt,
    **nicht** in `apps/api`/`apps/web`/`apps/mobile`-Code oder
    -Laufzeitkonfiguration. Weder Frontend noch Backend dieses Repos
    verarbeiten dieses Secret zur Laufzeit (ADR 0008 Punkt 4: `apps/api`
    kennt Okta nicht). Es fließt daher im Regelfall **nicht** durch
    GitHub Actions oder eine Deployment-Pipeline dieses Repos, solange die
    ZITADEL-/Okta-Konfiguration manuell im jeweiligen Admin-Portal gepflegt
    wird.
  - **Falls** künftig eine Infrastructure-as-Code-Automatisierung für die
    ZITADEL-/Okta-Konfiguration eingeführt wird (z. B. Terraform-Provider
    für ZITADEL/Okta, per GitHub-Actions-Workflow ausgerollt), dann — und
    nur dann — entsteht ein echter Bedarf, dieses Okta-Client-Secret (bzw.
    das SAML-Zertifikat) **in GitHub Actions** verfügbar zu machen. Dafür
    gilt als Ansatz:
    - **GitHub Environment Secrets** (nicht Repository-Secrets), separat
      pro Umgebung (`development`/`staging`/`production`), sodass ein
      Workflow-Lauf gegen "production" nur mit expliziter Environment-
      Freigabe auf das Produktiv-Secret zugreifen kann.
    - Niemals als Klartext in Workflow-YAML, Logs, `.env`-Dateien im Repo
      oder Dokumentation (auch nicht in dieser Notiz — hier wird bewusst
      nur der Handling-Ansatz beschrieben, kein konkreter Wert).
    - Referenzierung ausschließlich über `${{ secrets.<NAME> }}` in einem
      künftigen Deployment-/IaC-Workflow, niemals in `echo`/Debug-Ausgaben.
- **Bestehende ERP-/Lobster-Zugangsdaten (ADR 0001) bleiben unverändert
  außerhalb des Scopes dieser Story** — dieses Feature führt keine neue
  ERP-/Lobster-Anbindung ein (GPA wird zwar künftig aus SAP stammen, aber
  der Ingestion-Adapter selbst ist laut Backlog/ADR 0008 nicht Teil dieser
  Story). Das bereits in `docs/devops/lieferant-kontrakte-einsehen.md`
  dokumentierte Secrets-Handling für ERP/Lobster gilt unverändert fort und
  wird hier nicht wiederholt.
- **Least Privilege / Rotation / kein Logging**, sobald ein echtes Okta-
  Secret in einer Pipeline verarbeitet wird: gleiche Grundsätze wie bereits
  für ERP/Lobster dokumentiert — getrennte Credentials pro Umgebung,
  Rotation ohne Code-Deployment, striktes Verbot, das Secret oder daraus
  abgeleitete Tokens in CI-/Anwendungslogs zu schreiben (deckt sich mit dem
  Security-Befund "striktes Verbot, Zugangsdaten/Tokens/Klartext-GPA in
  Logs zu schreiben").
- **Secret-Scanning** (z. B. Gitleaks) als CI-Vorschlag (siehe
  Pipeline-Abschnitt), um ein versehentlich eingechecktes Okta-Client-
  Secret oder SAML-Zertifikat frühzeitig zu erkennen, bevor es in die
  Versionshistorie gelangt.

## Mobile-Release-Aspekte

**Für den aktuellen Umsetzungsstand dieser Story nicht relevant.** Laut
Implementierungsnotiz im Backlog wurde `apps/mobile` bewusst **nicht**
erweitert (`apps/mobile/src/auth/*` bleibt unverändert, kein Login-Screen).
Es gibt daher aktuell nichts an Mobile-spezifischer Release-/EAS-Build-
Logik zu planen oder anzupassen.

**Vorgemerkt für die künftige Iteration, sobald ein Mobile-Login-Screen
gebaut wird** (nicht jetzt umsetzen):

- ZITADEL benötigt laut ADR 0004 Implementierungsnotizen noch eine
  **separate Native-App-Registrierung** für `apps/mobile` (aktuell nicht
  eingerichtet) inkl. Redirect-URI-Scheme — das ist Voraussetzung, bevor
  ein EAS-Build sinnvoll gegen ZITADEL testen kann.
- Empfehlung für den OIDC-Flow auf Mobile: `expo-auth-session` mit
  System-Browser (`ASWebAuthenticationSession`/Chrome Custom Tabs) statt
  eingebettetem WebView — begünstigt sowohl PKCE-Sicherheit als auch
  App-Store-/Play-Store-Richtlinien zu Drittanbieter-Login-Flows; sichere
  Token-Ablage über `expo-secure-store` statt `AsyncStorage` (deckt sich
  mit dem Security-Befund zu Token-Speicherung im Web-Pendant).
  Beides bereits in ADR 0004 als "künftig naheliegende Bibliothek"
  vermerkt, hier nur als DevOps-Konsequenz für den Build-Prozess ergänzt.
- Nicht-geheime Konfiguration (Issuer, Client-ID) für EAS-Builds über
  **EAS-Umgebungs-/Build-Profile** (z. B. `eas.json`
  `env`-Konfiguration pro Profil `development`/`staging`/`production`)
  führen, konsistent mit der oben beschriebenen Web-Umgebungstrennung.
  Kein Okta-Bezug nötig, da Mobile laut ADR 0008 nie direkt mit Okta
  spricht.
- App-Store-/Play-Store-Submit (EAS Submit) ist für den Login-Flow selbst
  unkritisch (kein Sonderfall wie "Sign in with Apple"-Pflicht, da keine
  Social-Login-Anbieter-Konstellation vorliegt) — regulär im Rahmen des
  ohnehin bestehenden App-Freigabeprozesses zu behandeln, sobald ein
  Mobile-Release ansteht. Keine zusätzliche Anforderung durch dieses
  Feature identifiziert.

## Rollout-Plan

**Kein CD vorhanden — Vorschlag.** Auth ist ein besonders kritischer Pfad:
ein Fehler in Login/Föderation kann **alle** Lieferanten gleichzeitig
aussperren oder — schlimmer — die Mandantentrennung durchbrechen (siehe
Security-Befund "kritisch" zur Föderations-Vertrauenskette). Der Rollout
muss entsprechend vorsichtig gestaffelt werden, sobald ein echter
Login-Flow existiert:

1. **Vorbedingung (siehe Produktions-Gate oben):** kein Prod-Rollout, bevor
   die sieben dort genannten Punkte erfüllt und dokumentiert sind.
2. **Staging-Rollout** nach Integration eines echten OIDC-SDK (Web **und**
   Mobile): Deployment gegen ZITADEL Cloud `eu1` + Okta-Test-/Sandbox-
   Tenant, gefolgt von der im Produktions-Gate gelisteten manuellen
   QA-/Security-Abnahme (insbesondere AC3-Enumerationstest, Föderations-
   Konfigurationsprüfung, Nachweis deaktivierter Selbstregistrierung).
3. **Produktiver Rollout, sobald Staging grün und alle Gate-Punkte erfüllt
   sind** — empfohlen **schrittweise**, nicht als "big bang" für alle
   Lieferanten gleichzeitig:
   - **Feature-Flag/Kohorten-Rollout**, falls Feature-Flag-Infrastruktur
     existiert: zunächst eine kleine, bekannte Kohorte von GPA-
     Organizations (z. B. interne Test-Lieferanten oder ein einzelner
     Pilot-Lieferant) auf den neuen Login-Flow umstellen, bevor alle
     Anmeldungen betroffen sind.
   - Beobachtungsphase (siehe Monitoring): Login-Erfolgsquote,
     401-Rate, Verteilung der `userType`-Werte, bevor die volle
     Lieferantenbasis migriert wird.
   - Da diese Story laut ADR 0008 eine **Erweiterung** eines bereits
     bestehenden ZITADEL-Modells ist (kein Wechsel des IdP selbst), ist
     kein harter Cutover eines gesamten IdP nötig — das reduziert das
     Rollout-Risiko gegenüber einer vollständigen IdP-Migration.
4. **Rollback-Fähigkeit für den späteren echten Login-Flow:**
   - **Versionierte, schnell zurückrollbare Deployments** von `apps/api`
     und `apps/web` (z. B. Blue/Green oder vorherige Container-/Build-
     Version sofort erneut ausrollbar), da ein fehlerhafter Login-Flow
     sofort alle Lieferanten betrifft — Rollback-Zeit ist hier
     geschäftskritisch, nicht nur "best effort".
   - **Feature-Flag als schnellster Hebel**, sofern vorhanden: Login-Flow
     serverseitig/clientseitig deaktivierbar, ohne einen vollständigen
     Redeploy abzuwarten.
   - **Klarer Unterschied Code- vs. Konfigurationsfehler:** Da ein
     Login-Ausfall häufig eine ZITADEL-/Okta-**Konfigurationsänderung**
     (nicht `apps/*`-Code) zur Ursache haben kann (z. B. eine fehlerhafte
     Federation-/Claims-Mapping-Änderung), sollte ein Runbook existieren,
     das zuerst prüft, ob eine reine Konfigurations-Rückstufung in
     ZITADEL/Okta (kein Code-Rollback nötig) das Problem behebt — schneller
     als ein vollständiges Redeployment.
   - **Sicherheitsvorfall-Fall (Verdacht auf Mandantentrennungsbruch durch
     Föderations-Fehlkonfiguration, siehe Security-Befund "kritisch"):**
     sofortiges Sperren/Deaktivieren des betroffenen Federation-Links in
     ZITADEL (Notfall-Konfigurationsänderung) hat Vorrang vor einem
     Code-Rollback, da der Fehler laut Security-Bericht typischerweise
     **außerhalb** von `apps/*`-Code liegt und ein Code-Rollback ihn nicht
     beheben würde.
   - Sobald ein Logout-Mechanismus existiert (AC9, aktuell nicht
     implementiert), ist eine erzwungene Massen-Abmeldung/Token-
     Invalidierung ein zusätzliches operatives Werkzeug für den
     Sicherheitsvorfall-Fall — DevOps sollte diese Fähigkeit (z. B. über
     den ZITADEL End-Session-/Revocation-Endpunkt) als Teil der
     Incident-Response-Runbooks vorsehen, sobald sie implementiert ist.
   - **Heute nichts zurückzurollen:** Da kein funktionierender Login-Flow
     und keine CD-Pipeline existieren, ist dieser gesamte Abschnitt ein
     Vorschlag für die Zukunft, keine Beschreibung eines vorhandenen
     Mechanismus.

## Monitoring / Alerting

**Kein Monitoring/Log-Aggregation vorhanden — Vorschlag für eine künftige
Iteration.** Der Security-Bericht bemängelt explizit das vollständige
Fehlen von Audit-Logging für Login-/MFA-Ereignisse (per Grep bestätigt:
kein `console.*`/`Logger`-Aufruf in `*/auth`). Das ist aus DevOps-Sicht
heute kein Betriebsversäumnis (es gibt schlicht noch keinen Login-Code, der
etwas zu loggen hätte), aber die Ziel-Infrastruktur sollte vorgedacht sein,
damit sie bereitsteht, sobald Architect/Security ein Audit-Log-Konzept
liefern und Developer es implementiert:

- **Zentrales Log-Aggregations-Ziel** (Infrastrukturentscheidung noch
  offen, da noch keine Deployment-Plattform feststeht): `apps/api` sollte
  strukturierte Login-/MFA-Ereignis-Logs (Zeitpunkt, Erfolg/Fehlschlag,
  betroffene GPA, `userType` — Feldliste ist Architect-/Security-
  Entscheidung, nicht DevOps) an ein zentrales Ziel senden, statt lokal in
  Container-Logs zu verlieren. Aus DevOps-Sicht ist hier ausschließlich der
  **Transport/das Ziel** zu planen (z. B. Cloud-Provider-eigener
  Log-Dienst oder ein selbstbetriebener Aggregator), nicht der
  Log-Inhalt selbst.
- **Alerting-Kandidaten**, sobald Logs fließen:
  - **Ungewöhnliche Login-Fehlschlagsrate** (Anstieg der 401-/Fehlschlag-
    Rate) pro Zeitfenster — als Hinweis sowohl auf Brute-Force/Credential-
    Stuffing als auch, im hier relevanten Fall, auf eine **Föderations-
    Fehlkonfiguration** (deckt sich mit dem kritischen Security-Befund:
    eine fehlerhafte ZITADEL↔Okta-Verknüpfung könnte sich zuerst als
    plötzlicher Anstieg gescheiterter Logins zeigen, bevor sie als
    Mandantentrennungsproblem auffällt).
  - **JWKS-Verifikationsfehler-Rate** in `apps/api` (bereits als generelles
    Verfügbarkeitsrisiko in ADR 0004 benannt) — Anstieg kann auf
    ZITADEL-Ausfall oder ein Fehlkonfigurationsproblem hindeuten.
  - **Verteilung der `userType`-Werte** über die Zeit — ein plötzlicher,
    unerwarteter Wechsel der Verteilung könnte auf eine fehlerhafte
    Claims-/Provisionierungsänderung in ZITADEL/Okta hindeuten (siehe
    Security-Befund zur noch offenen Provisionierungskonfiguration von
    `userType`).
- **Explizit kein Logging sensibler Inhalte:** Striktes Verbot laut
  Security-Bericht, Zugangsdaten, Tokens oder GPA-Klartextwerte in Logs zu
  schreiben — gilt für jede künftige Implementierung dieses
  Audit-Log-Konzepts, unabhängig vom gewählten Log-Ziel. DevOps stellt bei
  der Auswahl der Log-Infrastruktur sicher, dass Zugriff auf diese Logs
  selbst wieder eingeschränkt/auditierbar ist (personenbezogene
  Login-Ereignisse, DSGVO-relevant laut ADR 0008 Datenklassifizierung).
- **Aufbewahrungsfristen** für Login-/MFA-Audit-Logs sind Teil des noch
  ausstehenden Audit-Log-Konzepts (Architect/Security) — DevOps setzt die
  vorgegebene Frist technisch um (Log-Retention-Policy im gewählten
  Aggregations-Ziel), legt sie aber nicht selbst fest.
