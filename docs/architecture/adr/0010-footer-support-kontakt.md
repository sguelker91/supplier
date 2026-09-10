# 0010. Footer mit Support-Kontakt: Platzierung auf App-Root-Ebene statt in AppShell

## Status
Akzeptiert

## Kontext

Die Story `docs/backlog/footer-support-kontakt.md` fordert einen auf **jeder**
Seite des Web-Frontends (`apps/web`) sichtbaren Footer mit der statischen
Support-Kontakt-Adresse `support@myemsland.de` als `mailto:`-Link (AC1–AC9).
Insbesondere AC2 verlangt, dass der Footer unabhängig vom Login-Status
erscheint — also auch auf der Login-Seite, nicht nur im eingeloggten
Portalbereich.

`docs/design/footer-support-kontakt.md` (UX/UI Architect) trifft dazu bereits
eine Layout-/IA-Empfehlung: ein neuer Design-System-Baustein `Footer`
(`apps/web/src/design-system/Footer.tsx` + `Footer.module.css` +
`Footer.spec.tsx`, analog zu `Card`, `AppShell`, `DataTable`,
`DateRangeFilter`), der **nicht** innerhalb von `AppShell`, sondern auf
App-Root-Ebene gerendert wird. Diese Empfehlung wurde anhand des
tatsächlichen Codes gegengeprüft:

- `apps/web/src/App.tsx`: `App()` rendert
  `<BrowserRouter><Routes>…</Routes></BrowserRouter>` mit genau zwei
  Top-Level-Routen: `AUTH_CALLBACK_PATH` (`AuthCallbackPage`) und `/*`
  (`Portal`). `Portal()` rendert wiederum
  `<ProtectedArea><AppShell>…<Routes>…</Routes>…</AppShell></ProtectedArea>`
  — eine **zweite**, verschachtelte `<Routes>`-Ebene für die eigentlichen
  Portal-Seiten (Kontrakte, Lieferberechtigungen).
- `apps/web/src/auth/ProtectedArea.tsx`: Ist der Nutzer nicht authentifiziert,
  gibt `ProtectedArea` **nicht** `props.children` (und damit nicht
  `AppShell`) zurück, sondern ersetzt den gesamten Baum durch `<LoginPage />`
  (optional zusätzlich einen `role="alert"`-Fehlertext). `LoginPage` wird
  also nie von `AppShell` umschlossen.
- Daraus folgt zwingend: Ein Footer, der nur *innerhalb* von `AppShell`
  eingehängt wird (z. B. als letztes Kind in dessen Markup), erscheint
  **nicht** auf `LoginPage` (verletzt AC2) und **nicht** auf
  `AuthCallbackPage` (eigene, zu `Portal` parallele Top-Level-Route, niemals
  innerhalb von `AppShell` gerendert).

Es ist daher eine architektonische Entscheidung nötig, an welcher Stelle im
Komponentenbaum von `apps/web` ein gemeinsamer, routenunabhängiger Footer
verankert wird — das betrifft die Struktur von `App.tsx` selbst und geht über
eine reine visuelle/IA-Frage hinaus.

## Entscheidung

Der Vorschlag des UX/UI Architect wird **bestätigt und für den Developer
verbindlich präzisiert**:

1. **Neuer Design-System-Baustein** `apps/web/src/design-system/Footer.tsx`
   (+ `Footer.module.css`, + `Footer.spec.tsx`), colocated wie die
   bestehenden Bausteine `Card`, `AppShell`, `DataTable`,
   `DateRangeFilter`. Der Baustein ist eine reine, zustandslose
   Präsentationskomponente ohne Pflicht-Props: Label-Text und
   `support@myemsland.de`-Adresse sind als Konstanten in `Footer.tsx`
   selbst hinterlegt (kein Prop-Durchreichen von `App.tsx`, keine
   Umgebungsvariable — konsistent mit dem Nicht-Ziel "keine
   Konfigurierbarkeit der E-Mail-Adresse" der Backlog-Story). Markup: ein
   natives `<footer>`-Element (ARIA-Landmark `contentinfo`), Inhalt gemäß
   `docs/design/footer-support-kontakt.md` (Label + `mailto:`-Link).

2. **Einhängepunkt: `apps/web/src/App.tsx`, `App()`-Funktion, als
   Geschwister-Element der äußeren `<Routes>` innerhalb von
   `<BrowserRouter>`** — nicht in `Portal()`, nicht in `AppShell`:

   ```tsx
   export function App() {
     return (
       <AuthProvider {...createZitadelAuthProviderProps()}>
         <BrowserRouter>
           <Routes>
             <Route path={AUTH_CALLBACK_PATH} element={<AuthCallbackPage />} />
             <Route path="/*" element={<Portal />} />
           </Routes>
           <Footer />
         </BrowserRouter>
       </AuthProvider>
     );
   }
   ```

   `<BrowserRouter>` akzeptiert beliebig viele Kind-Elemente; ein
   zusätzlicher Wrapper (`<div>`/`<>...</>`) ist nicht nötig. `<Footer />`
   wird bewusst **nach** `<Routes>` platziert (nicht davor), damit die
   DOM-/Vorlesereihenfolge der Landmark-Konvention folgt (Seiteninhalt
   zuerst, `contentinfo` zuletzt) — konsistent mit AC7 (Fokusreihenfolge)
   und der UX-Vorgabe "im Fluss, nicht sticky".

3. **Genau eine `Footer`-Instanz für die gesamte App.** Es wird kein
   zweiter Footer in `Portal()`/`AppShell` zusätzlich eingebaut. Damit
   erscheint der Footer unabhängig vom Zustand von `ProtectedArea`
   (`AppShell`-Portal **oder** `LoginPage`) sowie auf `AuthCallbackPage`
   und jeder künftigen Top-Level-Route unter `App()`, ohne dass einzelne
   Seiten oder `Portal()` selbst den Footer kennen oder einbinden müssen.

**Bewertung des UX-Vorschlags (Begründung der Bestätigung):**

- *Komponentenstruktur:* Ein einziger Einhängepunkt an der Wurzel ist
  strukturell einfacher als eine Footer-Instanz pro Verzweigung
  (`AppShell`-Zweig und `LoginPage`-Zweig getrennt), die dieselbe Logik an
  zwei Stellen duplizieren müsste. Der Ansatz vermeidet außerdem, dass eine
  künftige neue Top-Level-Route (z. B. eine weitere öffentliche Seite)
  vergisst, den Footer einzubinden — sie erbt ihn automatisch, weil sie
  ohnehin unter derselben `<BrowserRouter>`-Wurzel liegt.
- *Testbarkeit:* `Footer.spec.tsx` testet den Baustein isoliert
  (`render(<Footer />)`, AC9) unabhängig vom Routing-Zustand — kein
  Auth-Mocking nötig, um den Footer-Test zu schreiben. Ein zusätzlicher
  Integrationstest, der `App.tsx` end-to-end über verschiedene
  Auth-Zustände rendert, um die Root-Platzierung zu verifizieren, ist durch
  AC9 nicht gefordert und wird hier **nicht** als verbindlich
  vorgeschrieben (kein Scope-Zuwachs über die Story hinaus); er bleibt dem
  Developer als optionale Ergänzung freigestellt.
- *Konsistenz mit bestehendem Routing:* `apps/web` verwendet bereits
  `react-router-dom` (ADR 0009) und bereits zwei Ebenen von `<Routes>`.
  Ein persistentes Element als Geschwister der äußeren `<Routes>` ist ein
  in React-Router-Anwendungen etabliertes, unauffälliges Muster (z. B. für
  globale Layout-Rahmen) und führt **keine neue Bibliothek** ein (AC5) —
  es nutzt ausschließlich die bereits vorhandene `BrowserRouter`-API.
- *Alternative verworfen:* Footer nur in `Portal()` (als Geschwister von
  `<ProtectedArea>…</ProtectedArea>`, aber unterhalb der äußeren
  `<Routes>`) hätte AC2 (Login-Seite) erfüllt, nicht aber `AuthCallbackPage`
  — diese liegt außerhalb von `Portal()`. Da die Backlog-Story und die
  UX-Vorgabe (Abschnitt "Zentrale Entscheidung") den Footer ausdrücklich
  als "unabhängig vom Login-Status auf jeder Seite" verstehen und
  `AuthCallbackPage` eine reguläre, für den Nutzer sichtbare Seite ist
  (kurzzeitiger Redirect-Zwischenschritt, aber potenziell mit sichtbarem
  Ladezustand), wird die Root-Ebene in `App()` der Platzierung in
  `Portal()` vorgezogen.

**Keine neuen Grundsatzentscheidungen:** Diese ADR führt kein neues
Routing-, Test- oder Build-Werkzeug ein und trifft keine Aussage zu
Auth-, Lobster- oder Datenmodell-Fragen. Sie ist ausschließlich eine
Web-Frontend-interne Strukturentscheidung für einen einzelnen, rein
statischen UI-Baustein.

## Konsequenzen

- `App.tsx` erhält einen zusätzlichen Import (`Footer` aus
  `./design-system/Footer`) und eine minimale Strukturänderung
  (`<Footer />` als zweites Kind von `<BrowserRouter>`); `Portal()` und
  `ProtectedArea.tsx` bleiben unverändert.
- Der Footer erscheint dadurch technisch auch auf `AuthCallbackPage` —
  einer Seite, die AC2 nicht wörtlich benennt, aber laut UX-Design-Dokument
  von der Intention "jede Seite, unabhängig vom Login-Status" mit
  abgedeckt ist. Dies wird hier als bewusste, dokumentierte Auslegung von
  AC2/AC8 festgehalten, nicht als stillschweigende Scope-Erweiterung.
- Da `AppShell` (`.shell`, `min-height: 100vh`) unverändert bleibt (Nicht-Ziel
  der Story), erscheint der Footer im eingeloggten Portalbereich auf
  Desktop-Viewports typischerweise erst nach Scrollen unterhalb des von
  `AppShell` belegten Bereichs. Das ist eine explizit von UX/UI Architect
  akzeptierte Konsequenz der Entscheidung "im Fluss, nicht sticky" und
  keine neue Erkenntnis dieser ADR.
- Ein künftiger zweiter/dritter Footer-Inhalt (Impressum,
  Datenschutzerklärung, Versionsnummer, siehe offene Frage im Backlog) kann
  ohne erneute Strukturentscheidung in denselben `Footer`-Baustein
  aufgenommen werden, da der Einhängepunkt bereits app-weit ist.
- Risiko: Sollte eine künftige Top-Level-Route bewusst **ohne** Footer
  benötigt werden (aktuell nicht der Fall), müsste die Root-Platzierung
  revidiert und pro Route entschieden werden — das ist mit dem aktuellen
  Story-Umfang nicht notwendig und wird nicht vorab gelöst (YAGNI,
  konsistent mit der UX-Empfehlung, keine vorzeitige Erweiterbarkeit
  einzubauen).
- Es wird **keine neue Bibliothek** (AC5) und **kein neuer Design-Token**
  (AC4) eingeführt; `Footer.module.css` verwendet ausschließlich bestehende
  Tokens aus `apps/web/src/design-system/tokens.css` gemäß der Token-Tabelle
  in `docs/design/footer-support-kontakt.md`.

## Datenklassifizierung

Laut `docs/domain-glossar.md` betrifft diese Story ausschließlich die Rolle
**Lieferant** (`Supplier`, DSGVO-relevant: "Ja (Stammdaten)") — allerdings
nur insofern, als der Footer von Lieferanten betrachtet wird. Der Footer
selbst transportiert, speichert oder verarbeitet **keine**
Lieferanten-bezogenen oder sonstigen personenbezogenen Daten: Die
angezeigte Support-Adresse `support@myemsland.de` ist ein statischer,
unternehmensseitiger Kontaktpunkt, fest im Frontend-Code hinterlegt, ohne
Bezug zu Lieferberechtigung, Kontrakt, Abnahmeschein, Beleg,
Steuerbescheid, Prämie, Gutschrift, Mengenmeldung oder Abfrage/Umfrage.
Keine dieser Entitäten wird durch diese ADR im Datenmodell berührt. Es
werden keine ERP-/Lobster-Daten geladen oder angezeigt. Security/QA müssen
lediglich bestätigen, dass keine dynamischen oder aus ERP/Lobster
stammenden Daten in den Footer einfließen — eine vertiefte DSGVO-Prüfung
ist für diese Story nicht erforderlich (siehe Kontext-Hinweis in
`docs/backlog/footer-support-kontakt.md`).
