# Footer mit Support-Kontakt

Bezug: `docs/backlog/footer-support-kontakt.md`. Reine Layout-/IA-Entscheidung,
keine neue fachliche Domäne (nur Rolle "Lieferant" betroffen, siehe Backlog).

## Zentrale Entscheidung: Platzierung im Komponentenbaum (Antwort auf AC2 / offene Frage)

**Der Footer wird auf App-Root-Ebene gerendert — nicht (nur) innerhalb von
`AppShell`.**

Begründung (aus `apps/web/src/App.tsx` und `apps/web/src/auth/ProtectedArea.tsx`):

- `App()` rendert `<BrowserRouter><Routes>...</Routes></BrowserRouter>` mit
  zwei Top-Level-Routen: `AUTH_CALLBACK_PATH` (`AuthCallbackPage`) und `/*`
  (`Portal`).
- `Portal()` rendert `<ProtectedArea><AppShell>…</AppShell></ProtectedArea>`.
  `ProtectedArea` gibt bei fehlendem Login **nicht** `AppShell` zurück,
  sondern ersetzt es vollständig durch `<LoginPage />` (plus optional einen
  `role="alert"`-Fehlertext). `LoginPage` wird also nie von `AppShell`
  umschlossen.
- Läge der Footer nur *in* `AppShell` (z. B. als letztes Element in
  `.content` oder `.shell`), würde er auf der Login-Seite (AC2) und auf
  `AuthCallbackPage` **nicht** erscheinen — beide liegen außerhalb von
  `AppShell`.

**Entscheidung:** Ein neuer, gemeinsamer `Footer`-Baustein wird **einmal**,
oberhalb/außerhalb der Route-Unterscheidung, in `App()` platziert — als
Geschwister-Element von `<Routes>`, gemeinsam in einem schlanken
Root-Wrapper innerhalb von `<BrowserRouter>`. Damit erscheint der Footer
automatisch auf **jeder** Route (eingeloggtes Portal via `AppShell`,
Login-Seite, `AuthCallbackPage`, jede künftige Top-Level-Route), ohne dass
einzelne Seiten ihn selbst einbinden müssen.

Das ist eine bewusste **Präzisierung von AC8**: AC8 spricht von "Footer ist
Teil von `AppShell`" — das trifft für den eingeloggten Portalbereich weiter
zu (der Footer sitzt dort optisch unterhalb des durch `AppShell`
gerenderten Bereichs), erfüllt aber nicht AC2, wenn wörtlich nur *in*
`AppShell` verortet. Die App-Root-Ebene ist die einzige Stelle, die sowohl
"automatisch auf jeder heutigen und künftigen Seite" (AC8-Intention) als
auch "unabhängig vom Login-Status" (AC2) gleichzeitig erfüllt.

→ Siehe "Offene Fragen an Architect/Developer" für den strukturellen
Umsetzungshinweis in `App.tsx`.

## Informationsarchitektur

- Neuer, generischer Design-System-Baustein `Footer` (analog zu `Card`,
  `AppShell`, `DataTable`, `DateRangeFilter`): eigene Datei
  `apps/web/src/design-system/Footer.tsx` + `Footer.module.css` (+
  `Footer.spec.tsx` für AC9), colocated wie die bestehenden Bausteine.
- Inhalt ausschließlich: kurzer Label-Text + `mailto:`-Link. Keine weiteren
  Navigationspunkte, kein Impressum, keine Sprachumschaltung (siehe
  Nicht-Ziele der Story).
- Rolle im Seitenaufbau: Footer ist **kein** Bestandteil der
  Haupt-Content-Landmark (`<main>`); eigenes `<footer>`-Element
  (ARIA-Landmark `contentinfo`) auf Root-Ebene, nach dem jeweils
  gerenderten Routen-Inhalt.

## Layout

- Element: natives `<footer>` (kein `Card`-Container — ein Footer ist keine
  inhaltliche Karte, sondern ein schmaler Seitenabschluss-Balken).
- Volle Breite (`width: 100%`), **keine** `max-width`-Beschränkung —
  konsistent damit, dass auch `AppShell`/`Card` aktuell keine
  Seiten-`max-width` verwenden (siehe `docs/design/web-app-konsistenz-
  review.md`).
- Innenabstand: `padding: var(--space-3) var(--space-4);` (16px vertikal,
  24px horizontal) — 24px horizontal entspricht dem `Card`-Innenabstand,
  16px vertikal hält die Zeile schmal ("schmaler Footer" laut Story-Kontext).
- Trennung vom darüberliegenden Inhalt: `border-top: 1px solid var(--border);`
  (gleiches Token wie z. B. Tabellenzeilen-Trenner in `DataTable`).
- Hintergrund: `background: var(--bg);` (Standard-Seitenhintergrund, kein
  eigenständiger Oberflächenton nötig, da der Footer kein erhöhtes Element
  ist).
- Inhaltsanordnung: `display: flex; align-items: center; gap: var(--space-2);
  flex-wrap: wrap;` — Label-Text und Link nebeneinander, linksbündig; kein
  Zentrieren nötig (Footer ist ein schlichter Info-Balken, kein Hero-Element).
- Keine Rundung/kein Schatten (`--radius-*`/`--shadow-card` bewusst nicht
  verwendet) — ein Seiten-Footer ist kein "erhöhtes" Card-Element.

## Position im Seiten-Fluss: "im Fluss", nicht sticky (Antwort auf offene Frage)

**Empfehlung: Footer bleibt im normalen Dokumentfluss ("im Fluss"), kein
`position: sticky`/`fixed` am Viewport-Rand.**

Begründung:
- `AppShell.module.css` `.shell` hat bereits `min-height: 100vh` (volle
  Sidebar-Höhe per Design). Einen Footer zusätzlich *immer* ohne Scrollen
  sichtbar zu machen, würde erfordern, dieses Höhenmodell umzubauen (z. B.
  `.shell` auf `flex: 1` in einem äußeren Spalten-Wrapper umzustellen) —
  das wäre eine Änderung an `AppShell`-Layout selbst und damit laut
  Nicht-Zielen der Story ausdrücklich außerhalb des Scopes ("Keine
  Änderung an Navigation, Seiteninhalten oder sonstigen Bereichen von
  `AppShell` außerhalb der reinen Footer-Ergänzung").
- Ein fixierter Footer (`position: fixed`, am unteren Bildschirmrand
  angeheftet) riskiert auf schmalen Viewports bzw. bei langen Tabellen
  (`DataTable`) Überlappungen mit Inhalt — würde AC6 ("kein überlappender
  Inhalt") gefährden, ohne zusätzliche Bottom-Padding-Kompensation auf
  jeder Seite einzuführen.
- AC1/AC2 fordern nur, dass der Footer **sichtbar/vorhanden** ist — nicht,
  dass er ohne Scrollen erreichbar ist. "Im Fluss" erfüllt das mit der
  geringsten Eingriffstiefe.

Konsequenz: Auf kurzen Seiten (z. B. Login) erscheint der Footer je nach
Content-Höhe ggf. erst nach leichtem Scrollen sichtbar, auf normalen
Portal-Seiten steht er direkt unterhalb des durch `AppShell` belegten
Bereichs.

## Inhalt / Copy (Antwort auf offene Frage "erklärender Text ja/nein")

**Empfehlung: kurzer, expliziter Label-Text vor dem Link, kein vollständiger
Satz.**

- Aufbau: `Support-Kontakt: ` (Label, nicht verlinkt) gefolgt vom
  `mailto:`-Link, dessen sichtbarer Linktext exakt die Adresse ist:

  ```
  Support-Kontakt: support@myemsland.de
  ```

- Begründung: Ein nackter Link ohne Kontext ("was ist das für eine
  Adresse?") ist weniger selbsterklärend; ein voller Satz ("Fragen oder
  Probleme? Kontaktieren Sie unseren Support unter …") wirkt für einen so
  schmalen, auf jeder Seite wiederkehrenden Bereich zu schwer/prosaisch.
  Die kurze Label-Form übernimmt bewusst die in der Backlog-Story selbst
  verwendete Bezeichnung ("Support-Kontakt-E-Mail-Adresse").
- Linktext bleibt die vollständige, sichtbare E-Mail-Adresse (erfüllt
  AC7 direkt, kein zusätzliches `aria-label` nötig, da Linktext =
  Accessible Name = Zweck bereits eindeutig ist).

## Erweiterbarkeit (Antwort auf offene Frage)

**Empfehlung: keine vorzeitige Erweiterung/Slots einbauen, aber
erweiterungsfreundliches Layout wählen.**

- Kein neues `items`/`links`-Array-Prop, kein generisches Slot-System
  jetzt bauen — die Story deckt ausschließlich einen einzelnen
  Support-Link ab (siehe Nicht-Ziele), zusätzliche Flexibilität wäre
  ungenutzter Code (YAGNI).
- Die gewählte Struktur (`<footer>` mit `display: flex; gap: var(--space-2);
  flex-wrap: wrap;`) ist jedoch so gewählt, dass ein künftiges Hinzufügen
  weiterer Einträge (z. B. Impressum, Datenschutzerklärung, Versionsnummer
  als weitere `<span>`/`<a>`-Geschwister-Elemente im selben Flex-Container,
  ggf. mit einem zusätzlichen Trenner-Zeichen oder `gap`-Anpassung) ohne
  strukturellen Umbau möglich ist. Das ist keine Vorab-Implementierung,
  nur eine layouttechnisch unaufwändige Fortsetzbarkeit.
- Sollte eine Folge-Story tatsächlich weitere Footer-Inhalte bringen: dann
  erneut den UX/UI-Architect-Agenten für die konkrete Anordnung (z. B.
  mehrspaltig vs. weiterhin einzeilig) konsultieren.

## Responsive Verhalten

- Kein fester Breakpoint nötig. `flex-wrap: wrap;` genügt: auf sehr
  schmalen Viewports (Smartphone-Browserbreite) fällt der Link ggf. in
  eine zweite Zeile um, statt abgeschnitten zu werden oder zu überlappen
  (AC6).
- `word-break: normal;` (Standard) — die E-Mail-Adresse ist kurz genug, um
  auch auf sehr schmalen Viewports (≥ 320px) ohne manuellen Zeilenumbruch
  im Wort selbst zu passen.
- Kein Unterschied im Verhalten zwischen Desktop und Tablet/Mobile-Browser
  außer dem Zeilenumbruch bei Bedarf — keine separaten Layout-Varianten
  nötig.

## Farben/Tokens

Alle benötigten Werte sind bereits in `apps/web/src/design-system/tokens.css`
vorhanden — **kein neuer Token nötig** (erfüllt AC4/Nicht-Ziel
"keine Erweiterung des Design-Systems"):

| Zweck | Token |
|---|---|
| Seitenhintergrund Footer | `var(--bg)` |
| Trennlinie oben | `var(--border)` |
| Label-Text-Farbe | `var(--color-text-secondary)` |
| Link-Farbe | `var(--accent)` |
| Schriftart | `var(--font-family-base)` (global bereits auf `body` gesetzt, keine erneute Deklaration im Footer nötig) |
| Schriftgröße | `0.85rem` — kein Typografie-Skala-Token vorhanden (Projekt hat wie in `docs/design/web-app-konsistenz-review.md` dokumentiert keine `--font-size-*`-Tokens); Wert bewusst identisch zum bereits an anderer Stelle verwendeten `0.85rem` (`AppShell.module.css` `.navLink`), um keinen dritten/vierten "kleinen Text"-Wert einzuführen |
| Abstand Label ↔ Link | `var(--space-2)` |
| Innenabstand Footer | `var(--space-3)` / `var(--space-4)` |

Kein neuer Farb-/Radius-/Schatten-Token erforderlich.

## Accessibility

- Natives `<footer>`-Element → automatische ARIA-Landmark `contentinfo`,
  kein explizites `role` nötig.
- Link: natives `<a href="mailto:support@myemsland.de">support@myemsland.de</a>`
  — per Definition tastaturfokussierbar (Tab-Reihenfolge, letztes Element
  im DOM), kein `tabindex` nötig.
- Fokus-Indikator: **kein** `outline: none`/eigenes Fokus-Styling
  einführen — im gesamten `apps/web`-Code existiert aktuell keine
  CSS-`:focus`-Überschreibung (geprüft), der native Browser-Fokusring
  bleibt also automatisch erhalten und sichtbar (erfüllt AC7 ohne neuen
  Token/neue Komponente).
- Accessible Name des Links = sichtbarer Linktext = die E-Mail-Adresse
  selbst → erfüllt AC7 ("kein bedeutungsloses 'hier klicken'") ohne
  zusätzliches `aria-label`.
- Kontrast: `var(--accent)` (`#1c7a4d`, dunkles Grün) auf `var(--bg)`
  (oklch 98 %, nahezu Weiß) sowie `var(--color-text-secondary)` auf
  `var(--bg)` sind beides bereits an anderer Stelle im Produkt in
  ähnlichen Kombinationen im Einsatz (z. B. Sync-Hinweistexte); exakte
  WCAG-AA-Kontrastmessung ist wie in `docs/design/web-app-konsistenz-
  review.md` üblich Developer-/QA-Aufgabe bei Umsetzung, keine
  Auffälligkeit zu erwarten.
- Text-Kodierung: Label + sichtbare Adresse sind reiner Text, keine
  Farbkodierung als einziges Unterscheidungsmerkmal (Link ist zusätzlich
  durch native Link-Semantik/Unterstreichung-per-Default erkennbar, sofern
  kein `text-decoration: none` gesetzt wird — Empfehlung: Standard-
  Unterstreichung des Links **beibehalten**, nicht per CSS entfernen).

## Konsistenz-Hinweise

- Neuer Baustein folgt derselben Datei-Konvention wie bestehende
  Design-System-Elemente: `Footer.tsx` + `Footer.module.css` +
  `Footer.spec.tsx` (analog `Card`, `AppShell`, `DataTable`,
  `DateRangeFilter`).
- Trennlinien-Muster (`border-top: 1px solid var(--border)`) ist im Projekt
  bereits etabliertes Trennmittel (z. B. Zeilentrenner in `DataTable`).
- Kleiner Sekundärtext in `var(--color-text-secondary)` bei `0.85rem`
  entspricht dem bereits für Meta-/Sync-Hinweise vorgeschlagenen Muster
  (siehe `docs/design/web-app-konsistenz-review.md`, Abschnitt
  "Kontrakte-Seite").
- Footer wird bewusst **nicht** als `Card` umgesetzt — anders als
  Seiteninhalte (Kontrakte, Lieferberechtigungen), die laut Konsistenz-
  Review-Dokument konsequent in `Card` liegen; ein Footer ist strukturell
  ein Seitenabschluss, kein Inhalts-/Datenblock.

## Offene Fragen an Architect/Developer

- **Strukturelle Umsetzung in `App.tsx`**: Konkret bedeutet die oben
  getroffene Entscheidung, dass `App()` einen gemeinsamen Root-Wrapper
  um `<Routes>…</Routes>` **und** den neuen `<Footer />` benötigt (beide
  als Geschwister innerhalb von `<BrowserRouter>`), statt `Footer` nur in
  `AppShell` einzuhängen. Bitte bei Umsetzung gegenprüfen, ob das mit dem
  geplanten Verhalten von `ProtectedArea` (Ersetzen von `AppShell` durch
  `LoginPage` inkl. optionalem `role="alert"`-Fehlertext) und
  `AuthCallbackPage` konfliktfrei zusammenspielt.
- **Endgültigkeit der Adresse `support@myemsland.de`**: laut Backlog
  offen, ob Platzhalter oder final — das ist eine inhaltliche/organisa-
  torische Frage (Product Owner), keine Layout-Entscheidung; Layout ist
  unabhängig vom konkreten Adresswert.
- Exakte WCAG-AA-Kontrastmessung (Grün-Link/Sekundärtext auf
  `var(--bg)`) ist rechnerisch zu verifizieren (Developer/QA), analog zum
  Vorgehen in `docs/design/web-app-konsistenz-review.md`.
