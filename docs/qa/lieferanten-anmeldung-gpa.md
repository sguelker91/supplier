# QA-Bericht: Lieferanten-Anmeldung mit Geschäftspartnernummer (GPA) und Okta-MFA

## Vorbemerkung zum Prüfstand

Anders als beim vorangegangenen QA-Durchlauf (`docs/qa/lieferant-kontrakte-einsehen.md`)
existiert hier ein **echtes, installier- und testbares Monorepo**. Ich habe
`npm test --workspaces` und `npm run typecheck --workspaces` selbst ausgeführt
(nicht nur dem Implementierungsbericht vertraut):

```
npm test --workspaces
API:    3 Suites, 23 Tests — grün
Web:    2 Suites, 7 Tests — grün
Mobile: 1 Suite, 1 Test  — grün

npm run typecheck --workspaces
api / web / mobile: alle drei ohne Fehler
```

Das deckt sich mit dem Implementierungsbericht am Ende des Backlog-Files.
Geprüfter Code (Review + Testlauf): `apps/api/src/auth/auth-guard.service.ts`,
`zitadel-token.types.ts`, `user-type.ts`, `jose-token-verifier.ts`,
`testing/fake-token-verifier.ts`, `apps/api/src/contracts/contract.types.ts`,
`contracts.controller.ts`, `contracts.service.ts`, `auth-guard.service.spec.ts`,
`apps/api/test/contracts.e2e-spec.ts`, `apps/web/src/auth/LoginPage.tsx`,
`LoginPage.spec.tsx`, `auth-client.ts`, sowie zum Vergleich
`apps/mobile/src/auth/auth-client.ts`.

Wichtig für die Bewertung: Diese Story hat laut ADR 0008 einen bewusst
gemischten Charakter — ein Teil der Akzeptanzkriterien betrifft reines
Verhalten des externen Okta/ZITADEL-Verbunds (Konfiguration außerhalb von
`apps/*`) und ist per Definition **nicht durch Code/Tests in diesem Repo
abschließbar**. Das wird unten pro AC explizit unterschieden (Code-abgedeckt
vs. architektonisch/extern vorgesehen vs. Lücke), damit "nicht in diesem Repo
prüfbar" nicht mit "bestanden" verwechselt wird.

## Testfälle

| ID | Szenario | Erwartetes Ergebnis | Status |
|---|---|---|---|
| TC-01 (AC1, Happy Path) | Nutzer gibt gültige Zugangsdaten ein, schließt Okta-MFA erfolgreich ab | Erfolgreiche Anmeldung, Zugriff auf Extranet | **Nicht in diesem Repo prüfbar / im Code nicht funktionsfähig.** `apps/web/src/auth/auth-client.ts::loginWithZitadel()` wirft **immer** einen Fehler ("noch nicht implementiert ... es fehlt eine echte OIDC-Client-SDK-Integration"). Es gibt keinen funktionierenden Login-Flow, der Test (`LoginPage.spec.tsx`) bestätigt exakt dieses Fehlschlagen, nicht den Erfolgsfall. Okta-MFA selbst liegt laut ADR 0008 Punkt 4 vollständig außerhalb von `apps/*`. AC1 ist damit weder im Code erfüllt noch end-to-end testbar. |
| TC-02 (AC2) | Zugangsdaten gültig, Okta-MFA schlägt fehl/bricht ab/Timeout | Kein Zugriff, keine GPA-Daten ausgeliefert | **Nicht prüfbar, kein MFA-Schritt im Code vorhanden.** Die Backend-seitige Absicherung "keine Daten ohne gültiges Token" ist über `ZitadelAuthGuard`/`AuthGuardService` unabhängig davon solide getestet (`contracts.e2e-spec.ts`, 401 ohne/ mit ungültigem Token, keine `contractNumber` im Response). Der eigentliche MFA-Abbruchpfad selbst ist reine Okta-Policy-Frage (ADR 0008 explizit als "zu verifizierende Annahme", nicht durch diese Architektur garantiert). |
| TC-03 (AC3) | Ungültige Zugangsdaten, Ablehnung vor MFA-Aufforderung, generische Fehlermeldung (Enumeration-Schutz) | Keine Unterscheidbarkeit "GPA existiert nicht" vs. "Passwort falsch" | **Nicht in `apps/*` implementiert/prüfbar — von ADR 0008 selbst so benannt.** ADR 0008, Abschnitt "Explizit offen gelassen": "Wie genau Oktas Login-Oberfläche AC3 umsetzt ... ist Verhalten der Okta-Login-UI/-Policy-Konfiguration ... wird hier als zu verifizierende Annahme markiert, nicht als garantierte Eigenschaft." Es gibt keinen Code in diesem Repo, der AC3 umsetzt oder umsetzen könnte. |
| TC-04 (AC4, Happy Path) | Zwei unterschiedliche Anmeldungen (z. B. Lieferant, Steuerberater) derselben GPA melden sich an | Sitzungen eindeutig getrennt, keine Vermischung von Zugriffskontexten | **Code-abgedeckt, mit einer Einschränkung** (siehe Abschnitt "Vertiefte Prüfung AC4" unten). `auth-guard.service.spec.ts` ("zwei unterschiedliche Anmeldungen (userType) derselben GPA...") und `contracts.e2e-spec.ts` ("AC4 (ADR 0008): unterschiedliche Anmeldungen (userType) derselben GPA...") testen tatsächlich **dieselbe** synthetische GPA (`org_id: 'supplier-synthetic-a'`) mit zwei verschiedenen `sub`/`userType`-Werten — kein Test von zwei unabhängigen Suppliers. Das ist der richtige Testfall für AC4. |
| TC-05 (AC5, Happy Path) | Authentifizierte Anfrage an Extranet-Funktion | Intern wird ausschließlich die GPA aus dem verifizierten Auth-Kontext als `supplierId` verwendet, nicht die alte ERP-Kennung, nicht ein Client-Wert | **Bestanden, Code-abgedeckt.** Siehe Abschnitt "Vertiefte Prüfung AC5" unten. |
| TC-06 (AC6, Happy Path) | Nutzer sucht auf der Login-Seite (Web/Mobile) nach einer Registrierungsmöglichkeit | Keine Sign-up-Funktion vorhanden, einzige Option ist Login mit bestehenden Zugangsdaten | **Bestanden für Web, nicht anwendbar für Mobile (kein Login-Screen vorhanden).** Siehe Abschnitt "Vertiefte Prüfung AC6" unten. |
| TC-07 (AC7) | Nicht angemeldet / Token abgelaufen, Zugriff auf geschützten Bereich (Kontrakte, Belege) | Weiterleitung zur Anmeldeseite, keine Daten ausgeliefert | **Backend-Teil bestanden, Frontend-Teil nicht implementiert.** `contracts.e2e-spec.ts`: `GET /contracts` ohne Token → 401; mit ungültigem Token → 401, `response.body` ohne `contractNumber`; abgelaufenes Token wird laut `auth-guard.service.spec.ts` ebenfalls abgelehnt (`invalid_or_expired_token`). Die im AC geforderte **Weiterleitung zur Anmeldeseite** (Client-Verhalten) ist nicht umgesetzt: `LoginPage` ist laut Implementierungsnotiz bewusst **nicht** in `App.tsx` verdrahtet, es gibt keine Routing-/Redirect-Logik in `apps/web`, und `apps/mobile` hat überhaupt keinen Login-Screen. |
| TC-08 (AC8) | Login über Web bzw. Mobile, MFA muss in beiden Fällen gleichermaßen durchgesetzt werden | Keine Ausnahme für einen Client-Typ | **Nicht erfüllbar geprüft — Lücke.** Für Web existiert kein funktionierender Login (`loginWithZitadel` wirft immer), für Mobile existiert **gar kein** Login-Screen (`apps/mobile/src/auth/auth-client.ts` bleibt unverändert `declare function`, keine `LoginScreen`-Komponente). Die geforderte Gleichbehandlung beider Clients kann mangels jeglicher Implementierung auf keiner Seite verifiziert werden — nicht "gleich behandelt", sondern "auf beiden Seiten nicht vorhanden". |
| TC-09 (AC9) | Aktive Abmeldung nach erfolgreichem Login+MFA | Sitzung beendet, erneuter Zugriff erfordert vollständigen erneuten Login inkl. MFA | **Nicht implementiert — explizite, dokumentierte Lücke.** Kein Logout-Code in `apps/web`/`apps/mobile`/`apps/api`. Laut Implementierungsnotiz bewusst nicht umgesetzt ("Kein Logout-Flow (AC9)"). |
| TC-10 (Edge Case) | Token ohne GPA-tragenden Organization-Claim (`org_id`/`urn:zitadel:iam:user:resourceowner:id` fehlen) | Authentifizierung wird mit `missing_organization_claim` abgelehnt, kein stiller Fallback | **Bestanden.** `auth-guard.service.spec.ts`: "lehnt ein ansonsten gültiges Token ohne GPA-tragenden Organization-Claim ab". |
| TC-11 (Edge Case) | Token mit unbekanntem `user_type`-Wert (z. B. `'unbekannter-wert'`) | Kein Fehlerfall, `userType` wird `undefined`, GPA bleibt unberührt | **Bestanden.** `auth-guard.service.spec.ts`: `result.userType` ist `undefined`, `result.supplierId` bleibt korrekt. Deckt sich mit ADR 0008 ("unbekannter/fehlender Wert ist kein Fehlerfall"). |
| TC-12 (Fehlerbehandlung) | Abgelaufenes / Issuer-Mismatch / Audience-Mismatch / strukturell ungültiges Token | Definierte, unterscheidbare Ablehnungsgründe, kein `AuthenticatedSupplierContext` wird gebaut | **Bestanden**, alle vier Fälle einzeln in `auth-guard.service.spec.ts` getestet. |
| TC-13 (Autorisierungs-Scope, kritisch für ADR 0008) | Prüfen, ob `userType` irgendwo als Filter-/Autorisierungskriterium verwendet wird | `userType` darf ausschließlich transportiert, nie für Zugriffsentscheidungen ausgewertet werden | **Bestanden.** Siehe Abschnitt "Vertiefte Prüfung: userType ohne Autorisierungswirkung" unten. |
| TC-14 (Edge Case, nicht spezifiziert) | Nutzer mit mehreren GPA (z. B. Steuerberater mit mehreren Mandanten) | — | Laut Backlog explizit **nicht Ziel** dieser Story/ADR 0008 — korrekt nicht implementiert, keine Lücke. |
| TC-15 (Edge Case, nicht spezifiziert) | Provisionierung neuer Anmeldungen zu einer GPA | — | Laut Backlog explizit **außerhalb des Scopes** — korrekt nicht implementiert. |

## Vertiefte Prüfung AC4 (getrennte Sitzungen mehrerer Anmeldungen pro GPA)

Die Aufgabenstellung fragt explizit, ob der Test wirklich zwei unterschiedliche
Anmeldungen *derselben* GPA prüft oder nur zwei unabhängige Suppliers. Ergebnis:

- `auth-guard.service.spec.ts`, Test "zwei unterschiedliche Anmeldungen
  (userType) derselben GPA...": beide Tokens tragen `org_id:
  'supplier-synthetic-a'` (identisch), unterscheiden sich nur in `sub`
  (`synthetic-user-supplier` vs. `synthetic-user-freight-forwarder`) und
  `user_type` (`SUPPLIER` vs. `FREIGHT_FORWARDER`). Das ist tatsächlich ein
  Test von zwei Anmeldungen derselben GPA, kein Test zweier unabhängiger
  Suppliers.
- `contracts.e2e-spec.ts`, Test "AC4 (ADR 0008): unterschiedliche Anmeldungen
  (userType) derselben GPA...": ebenfalls identisches `org_id:
  'supplier-synthetic-a'`, unterschiedliche `userType` (`SUPPLIER` vs.
  `TAX_ADVISOR`). Beide HTTP-Requests erhalten dieselbe, korrekt gescopte
  Kontraktmenge.

**Aber (Einschränkung, keine Blockade):** Da das Auth-Modell laut ADR 0008
Punkt 2 explizit **zustandslos/tokenbasiert** ist ("keine zusätzliche
Session-Store-Logik in `apps/api` erforderlich"), gibt es im engeren Sinn
keine serverseitige "Sitzung", deren Trennung man isoliert testen könnte — die
"Trennung" ergibt sich strukturell daraus, dass jeder Request sein eigenes
Token unabhängig verifiziert. Die vorhandenen Tests prüfen korrekt das, was in
diesem Modell prüfbar ist (zwei unterschiedliche, gültige Tokens derselben GPA
ergeben unabhängig korrekte, nicht vermischte `AuthenticatedSupplierContext`-
Objekte inkl. korrektem `userType`). Sie prüfen **nicht** – und können es in
einem zustandslosen Modell auch nicht – ein hypothetisches
Session-Store-Leck (z. B. gemeinsamer In-Memory-State zwischen gleichzeitigen
Requests). Das ist kein Bug, sondern eine Konsequenz der Architektur;
gleichwohl sollte dies bei einer künftigen Einführung von serverseitigem
Session-State (z. B. Refresh-Token-Handling) erneut geprüft werden. **AC4:
bestanden** im Rahmen des aktuell entschiedenen zustandslosen Modells.

## Vertiefte Prüfung AC5 (GPA statt ERP-Kennung als `supplierId`)

- `auth-guard.service.ts::toSupplierContext()` leitet `supplierId`
  ausschließlich aus `claims.organizationId` ab, der wiederum ausschließlich
  aus dem kryptographisch verifizierten Token stammt (`jose-token-verifier.ts`,
  `fake-token-verifier.ts`) — niemals aus einem Client-Header/Query-/
  Body-Parameter. Es gibt in `AuthGuardService`, `ContractsController` und
  `ContractsService` **keine** Stelle, die `supplierId` aus etwas anderem als
  dem verifizierten Auth-Kontext übernimmt (`contracts.service.ts:49,71`
  arbeiten ausschließlich mit `auth.supplierId`).
- Test `auth-guard.service.spec.ts`: "baut aus einem gültigen Token den
  AuthenticatedSupplierContext mit supplierId === GPA auf (ADR 0008)" prüft
  das explizit per `toEqual({ supplierId: 'supplier-synthetic-a' })`.
- **Keine Altlasten gefunden, die die alte ERP-Kennungs-Annahme fortschreiben:**
  Der Code benennt `organizationId`/`missing_organization_claim` bewusst
  weiterhin technisch (Begründung im Kommentar: das beschreibt den
  ZITADEL-Mechanismus selbst, nicht die fachliche Bedeutung) — das ist
  explizit im Backlog begründet und **keine** inhaltliche Restannahme, dass
  `supplierId` etwas anderes als die GPA wäre. Die fachliche Aussage
  `supplierId === GPA` ist in `contract.types.ts` (Kommentar zu
  `AuthenticatedSupplierContext`) und `auth-guard.service.ts` unmissverständlich
  und konsistent dokumentiert.
- Eine separate, unveränderte `supplierExternalId` bleibt in
  `IncomingContractRecord` (Lobster-Kontraktgrenze, ADR 0001) bestehen — das
  ist bewusst **kein** Widerspruch zu AC5: AC5 bezieht sich ausdrücklich auf
  den *Auth-Kontext* (`AuthenticatedSupplierContext.supplierId`), nicht auf
  das separate Lobster-Datenkontrakt-Feld. Der von ADR 0008 selbst benannte
  Bruch zwischen `supplierExternalId` (Kontrakt-Import) und GPA-basierter
  `supplierId` (Auth) ist als offenes Risiko dokumentiert, nicht stillschweigend
  ignoriert.

**AC5: bestanden**, keine Abweichung gefunden.

## Vertiefte Prüfung AC6 (kein Self-Signup)

- `LoginPage.tsx` enthält tatsächlich **keinen** Registrierungs-/Sign-up-Link
  oder -Hinweis — verifiziert per Lesen der Komponente (nur ein `<button>`
  "Anmelden", ein `<h1>`, ein `<p>`, kein `<a>`/Link-Element).
- Der Test ist **aussagekräftig**, nicht nur eine Behauptung:
  `LoginPage.spec.tsx` prüft `queryByText(/registrieren/i)`,
  `queryByText(/konto anlegen/i)` **und** `queryByRole('link')` — Letzteres
  ist die robusteste Prüfung, da sie jeden Link unabhängig vom genauen
  Wortlaut ausschließt, nicht nur die zwei geratenen Textmuster.
- Repository-weite Verifikation (`grep -i "regist\|sign-up\|signup\|konto
  anlegen"` über `apps/web`, `apps/mobile`, `apps/api`, ausgenommen die
  Test-/Komponentendateien selbst, die den Begriff nur zur *Abwesenheits*prüfung
  nennen): **keine Treffer.** Es gibt tatsächlich nirgends eine
  Registrierungs-UI oder einen Registrierungs-Endpunkt.
- **Einschränkung:** Für `apps/mobile` ist AC6 nur *trivial* erfüllt — es gibt
  dort überhaupt keine Login-Oberfläche, also auch keine Registrierungsoption,
  aber auch keinen Test, der das für Mobile bestätigt (kein
  `LoginScreen.spec.tsx` o. Ä.). Die Implementierungsnotiz begründet dies
  nachvollziehbar (kein sinnvoller Teil-Scope für Mobile-Login). Für AC6
  reicht "nichts vorhanden" als Erfüllung, aber es ist wichtig, dies nicht mit
  "Mobile wurde geprüft und erfüllt AC6" zu verwechseln — es wurde für Mobile
  schlicht nichts gebaut, das AC6 verletzen könnte.

**AC6: bestanden** (Web durch echten, aussagekräftigen Test; Mobile trivial
mangels UI, nicht durch Test abgesichert).

## Vertiefte Prüfung: `userType` ohne Autorisierungswirkung (ADR-0008-Scope-Grenze)

Repository-weite Suche nach `userType` in `apps/api/src` und `apps/api/test`
ergibt Treffer ausschließlich in:

- Kommentaren/Dokumentation (die die fehlende Autorisierungswirkung erklären),
- `zitadel-token.types.ts`, `user-type.ts`, `jose-token-verifier.ts`,
  `fake-token-verifier.ts` (Extraktion/Typisierung),
- `auth-guard.service.ts` (Übernahme in den Kontext, ungefiltert:
  `userType: claims.userType ?? undefined`),
- `contract.types.ts` (Feld-Deklaration auf `AuthenticatedSupplierContext`),
- Tests (`auth-guard.service.spec.ts`, `contracts.e2e-spec.ts`).

**Kein Treffer** in `contracts.controller.ts` oder `contracts.service.ts` —
dort wird ausschließlich `auth.supplierId` verwendet
(`findManyForSupplier(auth.supplierId)`,
`contract.supplierId !== auth.supplierId`). Es gibt also **keine**
Fallunterscheidung nach `userType` im Guard oder in der
Repository-Filterung. Das entspricht exakt der ADR-0008-Vorgabe ("Guard/
Repository-Filter bleiben ausschließlich nach `supplierId` (GPA) scopend").

**Kein Scope-Verstoß gefunden.**

## Bewertung der Abweichung `loginWithZitadel()` (echte Funktion statt `declare function`)

Die im Backlog dokumentierte Abweichung ist für die **AC-Erfüllung nicht
ausreichend**, aber auch **nicht irreführend** — sie ist ehrlich markiert:

- Die Änderung macht `LoginPage.tsx` überhaupt erst lauffähig/testbar (statt
  eines zur Laufzeit abstürzenden `declare function`-Aufrufs). Das ist ein
  **Test-/Entwicklungsfortschritt**, kein funktionaler Fortschritt gegenüber
  AC1/AC2/AC8 — `loginWithZitadel()` liefert weiterhin **niemals** einen
  erfolgreichen Login.
- Die Fehlermeldung ist im UI sichtbar (`role="alert"`) und der Test
  (`LoginPage.spec.tsx`, "löst beim Klick den OIDC-Login-Versuch ... aus")
  prüft explizit, dass ein Fehler angezeigt wird, **nicht** dass ein Login
  gelingt. Es wird also kein Erfolg vorgetäuscht — im Gegenteil, das Verhalten
  ist bewusst so gebaut, dass ein Klick auf "Anmelden" immer sichtbar
  fehlschlägt.
- **Bewertung:** Diese Änderung täuscht keine funktionale Vollständigkeit vor.
  Sie ist aber auch kein Fortschritt gegenüber den funktionalen ACs — AC1
  ("wird erfolgreich angemeldet") bleibt vollständig unerfüllt, mit oder ohne
  diese Abweichung. Die Abweichung ist als reine Testbarkeits-/Ehrlichkeits-
  verbesserung sauber begründet und korrekt dokumentiert; sie verändert aber
  nichts am Befund, dass **kein einziges der AC1/AC2/AC8-Kriterien** durch
  einen tatsächlich funktionierenden Login-Code abgedeckt ist.

## DSGVO-Prüfpunkte

- **Zugriffskontrolle je Lieferant (Mandantentrennung):** Bestanden auf
  Backend-Ebene. `supplierId` (GPA) stammt ausschließlich aus dem verifizierten
  Token, nie aus Client-Input; bestehender Mandantentrennungstest aus
  `lieferant-kontrakte-einsehen` bleibt gültig; neue AC4-Tests zeigen, dass
  mehrere Anmeldungen derselben GPA korrekt auf dieselbe (und nur diese) GPA
  gescoped werden.
- **`userType` als personenbezogenes Attribut ohne Autorisierungswirkung:**
  Verifiziert (siehe oben) — korrekt umgesetzt, keine versteckte
  Berechtigungslogik. Dennoch bleibt `userType` laut ADR 0008 selbst
  DSGVO-relevant (Attribut einer personenbezogenen Anmeldung) — das ist ein
  Bewertungspunkt für Security, nicht durch QA/Code allein abschließbar.
- **Kein Klartext-Logging:** Es existiert in `apps/api/src/auth`,
  `apps/web/src/auth`, `apps/mobile/src/auth` **kein einziger** Logging-Aufruf
  (`console.*`, `Logger`) — verifiziert per Grep. Das ist aktuell weder
  bestanden noch verletzt, sondern ein **Blindfleck**: Sobald echtes
  Audit-/Fehler-Logging für Login-/MFA-Ereignisse eingeführt wird (von der
  Story selbst als offene Frage benannt: "Gibt es Anforderungen an
  Audit-Logging für Login-/MFA-Ereignisse?"), muss explizit sichergestellt
  werden, dass keine Zugangsdaten, Tokens oder GPA-Klartextwerte in Logs
  landen. Das gehört in die Definition of Done einer künftigen
  Logging-Implementierung.
- **Synthetische Testdaten:** Bestanden. Alle Test-/Fixture-Werte in
  `auth-guard.service.spec.ts`, `contracts.e2e-spec.ts`,
  `LoginPage.spec.tsx` verwenden ausschließlich klar erkennbare synthetische
  Bezeichner (`synthetic-test-issuer.example`, `supplier-synthetic-a`,
  `synthetic-user-*`, `synthetic-test-client-id` usw.). Keine real
  wirkenden Namen, GPA-Nummern, E-Mail-Adressen oder Zugangsdaten gefunden.
- **Aufbewahrung/Löschung von Login-/MFA-Ereignissen:** Nicht Gegenstand
  dieses Codes (kein Logging vorhanden, siehe oben) und laut Backlog selbst
  als offene Frage benannt — nicht bewertbar, da nichts existiert, das
  aufbewahrt/gelöscht werden könnte.
- **Okta als zusätzlicher Auftragsverarbeiter (AVV/Datenresidenz):** Laut
  ADR 0008 Punkt 5 explizit als harte, vor Produktivbetrieb zu klärende
  Voraussetzung benannt, nicht Teil des Codes — Security-Zuständigkeit, hier
  nur als Cross-Check bestätigt, dass die ADR diesen Punkt nicht
  verschweigt.

## Befunde / Bugs

1. **Kritisch (AC1/AC2/AC8) — kein funktionierender Login-Flow.**
   `loginWithZitadel()` in `apps/web` schlägt immer fehl; `apps/mobile` hat
   überhaupt keinen Login-Screen. Damit ist der zentrale, titelgebende
   Anwendungsfall der Story ("Anmeldung") clientseitig nicht funktionsfähig.
   Das ist konsistent dokumentiert (kein "erfundener" Fehlen-Befund), bleibt
   aber ein funktionaler Blocker für den produktiven Einsatz — unabhängig
   davon, dass ein Teil der Ursache (Okta/ZITADEL-Föderation, SDK-Wahl)
   außerhalb des Scopes dieser Story liegt.
2. **Kritisch (AC9) — kein Logout-Flow.** Explizit als nicht umgesetzt
   dokumentiert, kein Code vorhanden.
3. **Kritisch (AC7, Frontend-Teil) — keine Redirect-Logik.** Backend blockt
   korrekt (401, keine Daten), aber `apps/web` leitet nicht zur Login-Seite
   weiter (`LoginPage` nicht in `App.tsx` verdrahtet, kein Routing), und
   `apps/mobile` hat keinerlei entsprechenden Mechanismus.
4. **Nicht durch Code abschließbar, aber korrekt als offen dokumentiert (AC3):**
   Enumeration-Schutz vor MFA ist reine Okta-Konfigurationsfrage; ADR 0008
   markiert dies selbst zutreffend als ungarantierte, zu verifizierende
   Annahme.
5. **Kein Scope-Verstoß gefunden:** `userType` wird nirgends für
   Autorisierungsentscheidungen verwendet (siehe vertiefte Prüfung oben) —
   positiv hervorzuheben, da dies der naheliegendste Fehler bei einer
   solchen Erweiterung gewesen wäre.
6. **Kein AC5-Regressionsrisiko gefunden:** Keine Code-Stelle verwendet noch
   eine "alte ERP-Kennung" als `supplierId`-Quelle; die bewusst unveränderten
   technischen Bezeichner (`organizationId`, `missing_organization_claim`)
   sind nachvollziehbar begründet und nicht irreführend.
7. **Positiv:** AC4-Tests sind tatsächlich aussagekräftig für "mehrere
   Anmeldungen derselben GPA" (nicht nur zwei unabhängige Suppliers) — siehe
   vertiefte Prüfung.
8. **Blindfleck, keine Verletzung:** Kein Logging-Code vorhanden — Audit-Log-
   Konzept für Login-/MFA-Ereignisse bleibt laut Story selbst offen und muss
   vor Produktivbetrieb geklärt werden.
9. **Mobile-Testlücke:** Für `apps/mobile` existiert kein Test, der AC6 (kein
   Self-Signup) oder eine sonstige Login-bezogene Anforderung positiv
   bestätigt — es gibt dort schlicht keinen Login-Code. Das ist konsistent
   mit der Implementierungsnotiz, sollte aber nicht als "Mobile erfüllt AC6"
   missverstanden werden.

## Freigabe-Status

**Freigegeben mit Auflagen** — beschränkt auf den tatsächlich umgesetzten
Teil-Scope (`apps/api`: GPA-als-`supplierId`, `userType`-Transport ohne
Autorisierungswirkung, Mandantentrennung für Mehrfachanmeldungen; `apps/web`:
Login-Einstiegspunkt ohne Self-Signup).

Begründung:

- **Bestanden, code- und testabgedeckt:** AC4 (getrennte Sitzungen mehrerer
  Anmeldungen pro GPA, im Rahmen des zustandslosen Token-Modells), AC5 (GPA
  statt ERP-Kennung als `supplierId`, keine Client-Werte, keine Altlasten),
  AC6 (kein Self-Signup, Web durch aussagekräftigen Test, Mobile trivial).
  Zusätzlich verifiziert: `userType` hat nachweislich keine
  Autorisierungswirkung (kein Scope-Verstoß gegen ADR 0008).
- **Architektonisch/extern vorgesehen, korrekt als nicht code-prüfbar
  dokumentiert:** AC2 (MFA-Fehlschlag), AC3 (Enumeration-Schutz vor MFA) — beide
  hängen von der noch nicht existierenden Okta-/ZITADEL-Konfiguration ab; ADR
  0008 benennt dies selbst zutreffend als offene, zu verifizierende Annahme.
  Das ist keine Lücke dieser Implementierung, sondern korrekt zugeschnittener
  Scope.
- **Blockierend für einen produktiven Rollout des Gesamt-Features "Anmeldung"
  (nicht nur des geprüften Teil-Scopes):** AC1 (kein funktionierender
  Login-Flow, weder Web noch Mobile), AC7 (kein Redirect zur Login-Seite,
  Frontend-seitig), AC8 (MFA-Gleichbehandlung Web/Mobile nicht verifizierbar,
  da auf keiner Seite ein Login existiert) und AC9 (kein Logout). Diese vier
  Kriterien sind zentrale, in der User Story selbst benannte Verhaltens-
  anforderungen ("... möchte ich mich ... anmelden ...") und bleiben trotz
  des ehrlich dokumentierten, bewusst begrenzten Scopes **funktional
  unerfüllt**.

Die "Freigabe mit Auflagen" bezieht sich ausdrücklich nur auf die in dieser
Story tatsächlich beanspruchten Teilaspekte (`apps/api`-Datenmodell/-Guard-
Erweiterung um GPA/`userType`, `apps/web`-Login-Einstiegspunkt ohne
Registrierung) — nicht auf eine Produktivfreigabe des Features "Anmeldung"
als Ganzes. Vor einer Freigabe des Gesamt-Features sind mindestens
erforderlich: ein echtes OIDC-SDK mit funktionierendem Login (AC1/AC8), ein
Mobile-Login-Screen (AC1/AC6/AC8 für Mobile), Routing/Redirect für
nicht-authentifizierte Zugriffe (AC7) und ein Logout-Flow (AC9). Zusätzlich
sind — wie in ADR 0008 selbst gefordert — AVV/Datenresidenz für Okta sowie
ein Audit-Log-Konzept für Login-/MFA-Ereignisse vor Produktivbetrieb mit
echten Lieferantendaten zu klären (Security-Zuständigkeit).
