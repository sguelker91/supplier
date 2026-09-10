# Footer mit Support-Kontakt

## Kontext
Das Web-Frontend (`apps/web`) verfügt bereits über ein begonnenes
Design-System (`apps/web/src/design-system/`, siehe u. a.
`docs/backlog/lieferberechtigungen-anzeigen.md`) mit CSS-Variablen/Tokens
(`tokens.css`) und dem Manrope-Font als Typografie-Grundlage. Diese Story
ergänzt das bestehende Seiten-Grundgerüst (`AppShell`) um einen schmalen,
auf jeder Seite sichtbaren Footer, der Lieferanten eine Support-Kontakt-
E-Mail-Adresse anzeigt.

Es handelt sich um eine rein statische, informative UI-Ergänzung ohne
fachliche Verknüpfung zu Lieferberechtigung, Kontrakt, Abnahmeschein,
Beleg oder Mengenmeldung — der Footer zeigt ausschließlich einen fest
hinterlegten Platzhaltertext/eine Platzhalter-E-Mail-Adresse
(`support@myemsland.de`) an, keine lieferantenspezifischen oder aus
ERP/Lobster geladenen Daten.

**Plattform-Scope:** Diese Story deckt ausschließlich `apps/web` ab. Eine
Umsetzung in `apps/mobile` ist ausdrücklich kein Bestandteil dieser Story
(siehe Nicht-Ziele).

**Hinweis zu sensiblen Daten:** Diese Story berührt **keine**
personenbezogenen oder finanziellen Lieferantendaten (kein Steuerbescheid,
keine Prämie, keine Gutschrift, keine GPA-bezogene Anzeige). Die
Support-E-Mail-Adresse ist ein statischer, unternehmensseitiger
Kontaktpunkt, kein Lieferantendatum. Security/QA müssen dies lediglich
bestätigen, keine vertiefte DSGVO-Prüfung im Umfang der übrigen Stories
erwartet.

## User Story
Als Lieferant möchte ich auf jeder Seite des Extranet-Webportals einen
Footer mit einer Support-Kontakt-E-Mail-Adresse sehen, damit ich bei
Fragen oder Problemen jederzeit weiß, wie ich Unterstützung erreichen
kann, ohne danach suchen zu müssen.

## Akzeptanzkriterien

1. **Given** ein Lieferant befindet sich auf einer beliebigen Seite
   innerhalb des eingeloggten Extranet-Portalbereichs (z. B. Start,
   Kontrakte, Lieferberechtigungen), **when** die Seite gerendert wird,
   **then** ist am unteren Seitenrand ein Footer sichtbar, der die
   Support-Kontakt-E-Mail-Adresse `support@myemsland.de` anzeigt.
2. **Given** die Login-Seite bzw. eine nicht eingeloggte, öffentlich
   erreichbare Seite des Web-Frontends wird angezeigt, **when** die Seite
   gerendert wird, **then** ist derselbe Footer mit derselben
   Support-Kontakt-E-Mail-Adresse ebenfalls sichtbar (Footer ist
   unabhängig vom Login-Status auf jeder Seite vorhanden).
3. **Given** der Footer wird angezeigt, **when** die angezeigte
   E-Mail-Adresse betrachtet wird, **then** ist sie als `mailto:`-Link
   ausgezeichnet (Klick/Tap öffnet den Standard-E-Mail-Client des
   Nutzers mit `support@myemsland.de` als Empfänger).
4. **Given** der Footer wird gerendert, **when** seine Typografie und
   Farbwerte geprüft werden, **then** verwendet er ausschließlich den
   bestehenden Manrope-Font sowie bestehende CSS-Variablen/Tokens aus
   dem Design-System (`apps/web/src/design-system/tokens.css`); es werden
   keine neuen, fest codierten (hartkodierten) Farb-, Schriftgrößen- oder
   Schriftart-Werte eingeführt, die nicht bereits als Token existieren.
5. **Given** der Footer wird in den Quellcode-Abhängigkeiten von
   `apps/web` betrachtet, **when** `package.json`/`package-lock.json` von
   `apps/web` geprüft werden, **then** wurde für die Umsetzung des
   Footers keine neue externe Bibliothek/Abhängigkeit hinzugefügt
   (Umsetzung ausschließlich mit bereits vorhandenen Mitteln:
   React-Komponente + CSS Module/Design-System-Tokens).
6. **Given** der Footer wird auf einem Desktop- und auf einem
   schmaleren (Tablet-/Mobile-Browser-)Viewport dargestellt, **when** die
   Seite in beiden Breiten gerendert wird, **then** bleibt der Footer
   vollständig lesbar und die E-Mail-Adresse/der Link bleiben bedienbar
   (kein abgeschnittener oder überlappender Inhalt).
7. **Given** der Footer wird mit einem Screenreader oder per
   Tastaturnavigation genutzt, **when** der Fokus den `mailto:`-Link
   erreicht, **then** ist der Link fokussierbar, mit sichtbarem
   Fokus-Indikator versehen und sein Linktext/Accessible Name
   beschreibt eindeutig den Zweck (z. B. enthält die sichtbare
   E-Mail-Adresse selbst, kein bedeutungsloses "hier klicken").
8. **Given** der Footer ist Teil des gemeinsamen Seiten-Grundgerüsts
   (`AppShell`), **when** eine neue Seite/Route zum Portal hinzugefügt
   wird, **then** erscheint der Footer dort automatisch mit, ohne dass
   jede einzelne Seitenkomponente den Footer separat einbinden muss.
9. Es existiert mindestens ein automatisierter Test (Unit-/Component-Test
   analog zu bestehenden `*.spec.tsx`-Tests in `apps/web`), der
   verifiziert, dass der Footer gerendert wird und die Support-Adresse
   `support@myemsland.de` als `mailto:`-Link enthält.

## Betroffene Domänenbegriffe
- Lieferant

Hinweis: Über die Rolle "Lieferant" hinaus sind keine weiteren
Domänenbegriffe aus `docs/domain-glossar.md` (Lieferberechtigung,
Kontrakt, Abnahmeschein, Beleg, Steuerbescheid, Prämie, Gutschrift,
Mengenmeldung, Abfrage/Umfrage, Lobster, ERP-System, GPA) fachlich
betroffen — der Footer ist eine reine UI-Ergänzung ohne Bezug zu diesen
Objekten.

## Nicht-Ziele
- Keine Umsetzung in `apps/mobile` — falls ein vergleichbarer
  Support-Hinweis in der mobilen App gewünscht ist, ist das eine eigene
  Folge-Story.
- Kein Kontaktformular, kein Chat, kein Ticket-System — ausschließlich
  die Anzeige einer statischen E-Mail-Adresse als `mailto:`-Link.
- Keine Telefonnummer, Postanschrift, Öffnungszeiten oder weitere
  Kontaktkanäle/Impressumsangaben im Footer — nur die
  Support-Kontakt-E-Mail-Adresse ist Teil dieser Story.
- Keine Mehrsprachigkeit/Internationalisierung des Footer-Texts, sofern
  im Extranet aktuell nicht bereits vorhanden.
- Keine Konfigurierbarkeit der E-Mail-Adresse über Umgebungsvariablen,
  Backend oder Admin-Oberfläche — die Adresse wird als fest hinterlegter
  Platzhalter im Frontend-Code gepflegt (siehe Offene Fragen zur
  endgültigen Adresse).
- Keine Erweiterung/Neudefinition des Design-Systems selbst (neue
  Farb-Tokens, neue Schriftgrößen) — der Footer verwendet ausschließlich
  bereits vorhandene Tokens; sollten passende Tokens fehlen, ist das mit
  dem Architect-/UX-UI-Architect-Agenten zu klären, nicht eigenständig
  neu zu erfinden.
- Keine Änderung an Navigation, Seiteninhalten oder sonstigen Bereichen
  von `AppShell` außerhalb der reinen Footer-Ergänzung.

## Offene Fragen
- Ist `support@myemsland.de` bereits die final freigegebene
  Support-Adresse, oder handelt es sich (wie in der Feature-Beschreibung
  vermerkt) nur um einen Platzhalter, der vor Go-Live durch die
  tatsächliche Adresse ersetzt werden muss?
- Soll der Footer neben der reinen E-Mail-Adresse einen erklärenden
  Text enthalten (z. B. "Fragen? Kontaktieren Sie unseren Support:"),
  oder ausschließlich die Adresse selbst? Fachlich aus der
  Feature-Beschreibung nicht eindeutig ableitbar.
- Muss der Footer perspektivisch weitere Inhalte aufnehmen (z. B.
  Impressum, Datenschutzerklärung, Versionsnummer), sodass die
  Komponentenstruktur von Anfang an dafür vorbereitet werden sollte, oder
  bleibt er dauerhaft auf den Support-Kontakt beschränkt? Zu klären mit
  Architect/UX-UI-Architect vor der Umsetzung.
- Soll der Footer bei sehr langen Seiteninhalten am Ende des Inhalts
  ("im Fluss") oder als sticky/fixierter Bereich am unteren Bildschirmrand
  dargestellt werden? Layout-Entscheidung für den UX/UI-Architect-Agenten.

## Implementierungsnotizen

Umgesetzt gemäß `docs/architecture/adr/0010-footer-support-kontakt.md` und
`docs/design/footer-support-kontakt.md`, ohne Abweichungen:

- **Neu**: `apps/web/src/design-system/Footer.tsx` — zustandslose
  Präsentationskomponente ohne Pflicht-Props; Label-Text
  (`Support-Kontakt:`) und Adresse (`support@myemsland.de`) als Konstanten
  im Modul. Natives `<footer>`-Element (ARIA-Landmark `contentinfo`), Label
  als `<span>`, Adresse als `<a href="mailto:support@myemsland.de">`, deren
  sichtbarer Linktext exakt die Adresse ist (Accessible Name = Zweck, kein
  `aria-label` nötig, kein `outline`/`text-decoration` überschrieben — der
  native Fokusring/die Standard-Unterstreichung bleiben erhalten).
- **Neu**: `apps/web/src/design-system/Footer.module.css` — ausschließlich
  bestehende Tokens (`--bg`, `--border`, `--color-text-secondary`,
  `--accent`, `--space-2/3/4`) plus die bereits an anderer Stelle
  (`AppShell.module.css` `.navLink`) verwendete Schriftgröße `0.85rem`;
  volle Breite ohne `max-width`, `border-top`, kein Radius/Schatten, `flex`
  mit `flex-wrap: wrap` für Responsivität (AC6).
- **Neu**: `apps/web/src/design-system/Footer.spec.tsx` — zwei Tests
  (React Testing Library, analog `Card.spec.tsx`): verifiziert, dass ein
  Link mit Accessible Name `support@myemsland.de` und `href="mailto:
  support@myemsland.de"` gerendert wird (AC9), sowie dass der Footer als
  `contentinfo`-Landmark mit Label-Text erscheint.
- **Geändert**: `apps/web/src/App.tsx` — `Footer` importiert und als
  zweites Kind von `<BrowserRouter>`, nach der äußeren `<Routes>` und
  außerhalb von `Portal()`/`AppShell` eingehängt, exakt wie im Code-Beispiel
  der ADR. Dadurch genau eine Footer-Instanz für die gesamte App, sichtbar
  unabhängig vom `ProtectedArea`-Zustand (eingeloggtes Portal via
  `AppShell` oder `LoginPage`) sowie auf `AuthCallbackPage` (AC1, AC2, AC8).
  `Portal()` und `ProtectedArea.tsx` unverändert.
- Verifikation: `npm run typecheck --workspace=apps/web`,
  `npm test --workspace=apps/web` (55/55 Tests grün, inkl. der zwei neuen
  Footer-Tests) und `npm run build --workspace=apps/web` liefen alle
  erfolgreich, keine bestehenden Tests wurden verändert oder sind
  gebrochen.
- Keine neue npm-Abhängigkeit hinzugefügt (AC5); `package.json`/
  `package-lock.json` von `apps/web` unverändert.
- Abweichungen von ADR/Design-Dokument: keine.
