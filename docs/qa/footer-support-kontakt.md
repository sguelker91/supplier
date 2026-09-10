# QA-Bericht: Footer mit Support-Kontakt

Bezug: `docs/backlog/footer-support-kontakt.md`, `docs/architecture/adr/0010-footer-support-kontakt.md`,
`docs/design/footer-support-kontakt.md`.

Geprüfte Artefakte:
- `apps/web/src/design-system/Footer.tsx`
- `apps/web/src/design-system/Footer.module.css`
- `apps/web/src/design-system/Footer.spec.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/design-system/tokens.css`, `apps/web/src/design-system/AppShell.module.css`
- `apps/web/src/auth/ProtectedArea.tsx`
- `apps/web/package.json`, `apps/web/package-lock.json` (Git-Historie)

Verifikationsläufe (selbst ausgeführt, nicht nur aus Implementierungsnotiz übernommen):
- `npm test --workspace=apps/web` → **55/55 Tests grün** (15 Suiten), inkl. der 2 neuen `Footer.spec.tsx`-Tests.
- `npm run typecheck --workspace=apps/web` → grün, keine Fehler.
- `npm run build --workspace=apps/web` → grün, Produktionsbuild erfolgreich.

## Testfälle

| ID | Szenario | Erwartetes Ergebnis | Ergebnis |
|---|---|---|---|
| TC1 (AC1) | `Footer` als Geschwister von `<Routes>` in `App()`, sichtbar unabhängig von `Portal()`-Route (z. B. `/contracts`, `/delivery-authorizations`) | Footer mit `support@myemsland.de` am unteren Seitenrand sichtbar | **Bestanden** – Code-Review: `<Footer />` steht auf App-Root-Ebene außerhalb von `Portal()`/`AppShell`, erscheint bei jeder `/*`-Route (`Footer.tsx` Z. 19-28, `App.tsx` Z. 109-126) |
| TC2 (AC2) | `ProtectedArea` nicht authentifiziert → `LoginPage` statt `AppShell`; ebenso Ladezustand (`auth.isLoading`, `<p role="status">`) | Footer trotzdem sichtbar, da er nicht Teil von `ProtectedArea`/`Portal()` ist | **Bestanden** – `ProtectedArea.tsx` Z. 26-49 ersetzt nur `props.children` (=`AppShell`-Inhalt innerhalb `Portal()`); `<Footer />` liegt strukturell eine Ebene höher (Geschwister der äußeren `<Routes>` in `App()`) und wird in keinem der drei `ProtectedArea`-Zweige (loading/unauthenticated/authenticated) verdrängt |
| TC3 (AC2) | `AuthCallbackPage`-Route (`AUTH_CALLBACK_PATH`) | Footer ebenfalls sichtbar | **Bestanden** – eigene Top-Level-Route parallel zu `Portal`, beide unterhalb derselben `<Routes>`, die wiederum Geschwister von `<Footer />` ist |
| TC4 (AC3) | Automatisierter Test prüft `href`-Attribut des Links | `href="mailto:support@myemsland.de"` | **Bestanden** – `Footer.spec.tsx` Z. 14-16, durch eigenen Testlauf reproduziert (grün) |
| TC5 (AC4) | Alle in `Footer.module.css` verwendeten Werte gegen `tokens.css` abgleichen | Nur bestehende Tokens, keine neuen hartkodierten Werte außer dokumentiertem `0.85rem` | **Bestanden** – verwendet `var(--space-2/3/4)`, `var(--border)`, `var(--bg)`, `var(--color-text-secondary)`, `var(--accent)` — alle in `tokens.css` Z. 18-41 vorhanden. Kein `font-family` in `Footer.module.css` gesetzt → erbt `var(--font-family-base)` (Manrope) von `body` (`tokens.css` Z. 47). Einziger literaler Wert: `0.85rem` (zweimal, Z. 15/20) — durch Grep verifiziert identisch zum bereits bestehenden `AppShell.module.css:45` (`.navLink { font-size: 0.85rem; }`), also kein *neuer* Wert, sondern Wiederverwendung eines bereits im Code vorhandenen (wenn auch nicht als CSS-Variable ausgelagerten) Zahlenwerts – wie in ADR 0010/Design-Dokument dokumentiert und begründet (kein `--font-size-*`-Token im Projekt vorhanden) |
| TC6 (AC5) | `apps/web/package.json`/`package-lock.json` auf neue Abhängigkeiten prüfen | Keine neue Abhängigkeit | **Bestanden** – `git status`/`git log` zeigen keine Änderung an beiden Dateien im Rahmen dieser Story; letzte Änderungen an `package.json`/`package-lock.json` stammen aus vorherigen, unabhängigen Commits (`58ac44d`, `2953b8f`, `1b97c61`) |
| TC7 (AC6) | Layout bei Desktop- vs. schmalem Viewport | Kein abgeschnittener/überlappender Inhalt, Link bedienbar | **Bestanden (statische Code-Prüfung, kein Browser-/Viewport-Test)** – `width: 100%`, `box-sizing: border-box`, `display: flex; flex-wrap: wrap`, kein `max-width`/`white-space: nowrap`; Adresse ist kurz genug für Umbruch statt Abschneiden. **Einschränkung**: Kein automatisierter oder manueller Screenshot-/E2E-Test über mehrere Viewportbreiten wurde ausgeführt (auch AC9 fordert das nicht) – rein aus dem CSS abgeleitet |
| TC8 (AC7) | Tastaturfokus erreicht den `mailto:`-Link | Fokussierbar, sichtbarer Fokus-Indikator, Accessible Name = Adresse | **Bestanden** – natives `<a href>` ist per Definition fokussierbar; Grep über `apps/web/src` bestätigt: **keine** `:focus`-Regel und **kein** `outline: none` im gesamten Web-Frontend → nativer Browser-Fokusring bleibt aktiv. Accessible Name = sichtbarer Linktext `support@myemsland.de` (kein `aria-label`), durch `Footer.spec.tsx` (`getByRole('link', { name: 'support@myemsland.de' })`) verifiziert |
| TC9 (AC7, ergänzend) | Farbkontrast Label/Link auf Footer-Hintergrund (WCAG AA, Normaltext) | ≥ 4,5:1 | **Bestanden** – selbst berechnet (OKLCH→sRGB→relative Luminanz): `--color-text-secondary` auf `--bg` ≈ **5,19:1**; `--accent` auf `--bg` ≈ **5,03:1**. Beide über der AA-Schwelle für Normaltext (0,85rem ≈ 13,6px < 18pt/24px) |
| TC10 (AC8) | Neue künftige Top-Level-Route unter `App()` | Footer erscheint automatisch, ohne Einzel-Einbindung | **Bestanden, mit dokumentierter Präzisierung** – Footer sitzt strukturell oberhalb aller Routen (Geschwister von `<Routes>`), nicht nur "innerhalb AppShell" wie AC8 wörtlich formuliert. ADR 0010 dokumentiert diese bewusste Auslegung explizit und begründet sie (AC2 wäre sonst verletzt) – keine stillschweigende Abweichung, sondern nachvollziehbar in Backlog-Implementierungsnotiz und ADR festgehalten |
| TC11 (AC9) | Mindestens ein aussagekräftiger automatisierter Test | Test verifiziert Rendering + `mailto:`-Link mit korrekter Adresse | **Bestanden** – zwei Tests in `Footer.spec.tsx`: (1) Link mit Accessible Name und `href` exakt geprüft, (2) `contentinfo`-Landmark + Label-Text. Beide durch eigenen `npm test`-Lauf reproduziert, grün |
| TC12 | Regressionsprüfung: bestehende Tests unverändert/nicht gebrochen | Keine bestehenden Tests verändert oder rot | **Bestanden** – `git diff` zeigt keine Änderungen an bestehenden `*.spec.tsx`-Dateien außer der neuen `Footer.spec.tsx`; Gesamtlauf 55/55 grün |
| TC13 | Typecheck & Produktionsbuild | Beide grün, keine TS-Fehler, keine Build-Fehler | **Bestanden** – `npm run typecheck --workspace=apps/web` und `npm run build --workspace=apps/web` beide erfolgreich (selbst ausgeführt) |

## DSGVO-Prüfpunkte

Gemäß Backlog-Story und ADR 0010 ist für dieses Feature **keine vertiefte DSGVO-Prüfung** erforderlich, da keine personenbezogenen oder finanziellen Lieferantendaten (Steuerbescheid, Prämie, Gutschrift, GPA-Daten) betroffen sind. QA bestätigt dies durch eigene Code-Prüfung, nicht nur durch Übernahme der Aussage:

- **Keine dynamischen/ERP-/Lobster-Daten im Footer**: `SUPPORT_LABEL` und `SUPPORT_EMAIL` sind feste String-Konstanten in `Footer.tsx` (Z. 16-17), keine Props, kein Fetch, kein Store-Zugriff, keine Umgebungsvariable. **Bestätigt.**
- **Keine Mandantentrennung/Zugriffskontrolle nötig**: Der Footer wird unabhängig vom Auth-/Mandanten-Zustand identisch für jeden Lieferanten gerendert (kein `useAuth()`-Zugriff in `Footer.tsx`, keine Personalisierung). Da keine lieferantenspezifischen Daten angezeigt werden, entfällt das Erfordernis einer Zugriffskontrolle je Lieferant. **Bestätigt, kein Befund.**
- **Kein Klartext-Logging**: `Footer.tsx` enthält keinerlei `console.*`-Aufrufe oder sonstige Logging-Instrumentierung (per Grep verifiziert). Die Support-Adresse ist ohnehin ein öffentlicher, unternehmensseitiger Kontaktpunkt und kein zu schützendes Datum, aber auch hier: keine Log-Ausgabe vorhanden. **Bestätigt.**
- **Aufbewahrung/Löschung**: Nicht anwendbar – es werden keine Nutzer- oder Lieferantendaten gespeichert, weder client- noch serverseitig, durch dieses Feature. **Bestätigt, kein Prüfpunkt offen.**
- **Sensible-Felder-Sonderfall (Steuerbescheid/Prämie/Gutschrift)**: Von dieser Story nicht berührt; im gesamten Diff (`Footer.tsx`, `Footer.module.css`, `Footer.spec.tsx`, `App.tsx`) kein Bezug zu diesen Domänenbegriffen. **Bestätigt.**

Ergebnis: Die Einschätzung aus Backlog/ADR ("keine vertiefte DSGVO-Prüfung erforderlich") wird von QA nach eigener Prüfung **bestätigt**.

## Befunde / Bugs

Keine blockierenden Befunde. Zwei nicht-blockierende Hinweise zur Dokumentation/Nachvollziehbarkeit (kein Code-Fehler):

1. **AC6 (Responsive) nur statisch geprüft, kein visueller/E2E-Test**: Die Bewertung "vollständig lesbar, keine Überlappung" bei Desktop- und schmalem Viewport stützt sich ausschließlich auf CSS-Analyse (`flex-wrap: wrap`, `width: 100%`, kein `white-space: nowrap`), nicht auf einen tatsächlichen Rendering-Test in unterschiedlichen Breiten (Playwright/Cypress o. ä. existiert in `apps/web` aktuell nicht). Dies ist **kein Verstoß gegen AC9** (das nur einen Rendering-/mailto-Test verlangt) und daher **nicht blockierend**, sollte aber bei einer künftigen visuellen Regressionsstrecke nachgeholt werden.
2. **AC8-Wortlaut vs. Umsetzung**: AC8 spricht wörtlich von "Footer ist Teil des gemeinsamen Seiten-Grundgerüsts (`AppShell`)". Die tatsächliche Platzierung ist bewusst **oberhalb** von `AppShell` (App-Root-Ebene), um AC2 nicht zu verletzen. Dies ist in ADR 0010 explizit als bewusste, begründete Auslegung dokumentiert (nicht stillschweigend) — QA wertet dies als erfüllt im Sinne der Intention von AC8, nicht als Abweichung, die eine Nacharbeit erfordert.

## Freigabe-Status

**Bestanden**

Alle 9 Akzeptanzkriterien der Story `footer-support-kontakt` sind durch Code-Review, eigene Testläufe (`npm test`/`typecheck`/`build`, alle grün, 55/55 Tests) und ergänzende Berechnungen (Kontrastverhältnisse) verifiziert. Keine neue Abhängigkeit (AC5), keine neuen hartkodierten Design-Werte außer dem dokumentierten, bereits im Code vorhandenen `0.85rem`-Präzedenzfall (AC4), Accessibility-Anforderungen (AC7) inklusive Fokus-Indikator und Kontrast erfüllt, mindestens ein aussagekräftiger automatisierter Test vorhanden (AC9). DSGVO-Einschätzung aus Backlog/ADR wird bestätigt, keine vertiefte Prüfung erforderlich. Keine blockierenden Befunde.
