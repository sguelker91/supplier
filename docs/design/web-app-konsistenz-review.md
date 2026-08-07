# Konsistenz-Review `apps/web`

Bereichsübergreifende Überarbeitung, kein neues Feature — Abgleich des
IST-Zustands gegen das seit ADR 0009 bestehende Mini-Design-System
(`apps/web/src/design-system/`). `DeliveryAuthorizationsListPage` dient als
Referenz für "korrekte" Design-System-Nutzung.

Betroffen: `apps/web/src/contracts/ContractsListPage.tsx` (kein
Design-System-Einsatz), `apps/web/src/auth/LoginPage.tsx` +
`LoginPage.module.css` (eigenes Konzept, aber fest kodierte Werte statt
Tokens), `apps/web/src/design-system/AppShell.tsx` +
`AppShell.module.css` (kurzer Konsistenz-Check).

Kein bestehendes `docs/design/*.md`-Dokument vorhanden — keine
Vorgängerentscheidungen zu berücksichtigen, aber diese Datei etabliert das
Muster für künftige `docs/design/*.md`-Reviews.

---

## Kontrakte-Seite (`ContractsListPage.tsx`)

### Layout
- Wie `DeliveryAuthorizationsListPage`: gesamter Seiteninhalt in genau eine
  `Card` (`design-system/Card`) mit `title="Kontrakte"` — ersetzt das
  aktuelle nackte `<section><h1>Kontrakte</h1>...`.
- Keine zusätzliche `max-width`-Beschränkung nötig — `Card` übernimmt
  Hintergrund/Radius/Schatten/Padding, `AppShell`-`.content` liefert das
  äußere Seiten-Padding (`--space-4`) bereits.

### Meta-/Sync-Hinweis (AC6/AC8 der Story `lieferant-kontrakte-einsehen`)
- Aktuell: reiner `<p role="status">`-Text ohne Styling. Beibehalten als
  `role="status"`-Text (Accessibility-Verhalten korrekt), aber unter dem
  Card-Titel platziert, mit `color: var(--color-text-secondary)` und
  `font-size: 0.85rem` (angelehnt an `DataTable`-Statuszeilen-Stil), Abstand
  nach unten `var(--space-3)`.
- Stale-Hinweis ("Achtung: Daten möglicherweise veraltet") farblich nicht
  über `color-status-expired` (das ist für "abgelaufener Kontrakt", nicht
  für "Datenstand veraltet" reserviert) — stattdessen weiterhin reiner Text,
  ggf. `font-weight: 600`, um ihn hervorzuheben, ohne eine neue Bedeutung an
  ein bestehendes Status-Token zu koppeln.

### Leer-Zustand (AC5)
- Ersetzt durch dieselbe Konvention wie `DataTable`s eingebauten
  Leer-Zustand: Text in `color: var(--color-text-secondary)`,
  `padding: var(--space-3)` — visuell konsistent, auch wenn hier (da keine
  Ladezustände/Fehler für Kontrakte existieren) kein `DataTable`-Wrapper
  nötig ist, sondern weiterhin eine eigene Bedingung in
  `ContractsListPage`.
- Offene Frage: Sobald Kontrakte über `apps/api` geladen werden (statt
  `DEMO_DATA`), sollten Lade-/Fehlerzustand denselben `DataTable`-Konventionen
  folgen wie bei Lieferberechtigungen (`role="status"` / `role="alert"`,
  s. `DataTable.module.css` `.status`) — siehe "Offene Fragen" unten.

### Tabelle
- Komponente: bestehende generische `DataTable` aus dem Design-System
  (laut Kommentar in `DataTable.tsx` explizit "auch für Kontrakte" gedacht)
  statt roher `<table>`.
- Spalten identisch zu den bisherigen sechs Spalten: Kontraktnummer,
  Artikel/Warengruppe, Menge, Gültig von, Gültig bis, Status.
- Keine Zeilenauswahl (`selection`-Prop weglassen) und kein `rowActions` —
  Kontrakte-Liste ist reine Ansicht, keine Bulk-Aktion/Detail-Navigation
  laut Story-Notizen ("Kein Routing/Menüpunkt", "Keine Detailansicht").
- `emptyState`-Prop von `DataTable` nutzen statt eigenem Leer-Text-Absatz:
  `emptyState="Keine Kontrakte vorhanden."` — vereinheitlicht mit
  Lieferberechtigungen-Musters (`"Keine Lieferberechtigungen im gewählten
  Zeitraum."`).
- Sticky Header: nicht nötig, kein bestehendes Muster dafür im
  Design-System (auch `DeliveryAuthorizationsListPage` hat keinen) — nicht
  neu einführen.

### Status-Spalte: Badge statt Klartext
- Bestehende, bisher ungenutzte Tokens `--color-status-active` und
  `--color-status-expired` (in `tokens.css` bereits vorhanden, siehe
  Kommentar "künftig migrierte Seiten (z. B. `ContractsListPage`)") sind
  exakt für diesen Zweck vorgesehen — jetzt erstmals als sichtbares
  UI-Element einsetzen statt nur für den `disabled`-Zustand eines Buttons.
- Neue Komponente (klein, lokal in `contracts/`, kein globales
  Design-System-Element, da bisher nur an dieser einen Stelle benötigt):
  `StatusBadge` bzw. eine `.module.css`-Klasse `statusBadge` in einer neuen
  `ContractsListPage.module.css`.
- Badge-Stil:
  - `display: inline-flex`, `align-items: center`, `gap: var(--space-1)`
  - `padding: var(--space-1) var(--space-2)`
  - `border-radius: var(--radius-control)` (10px, wie andere kleine
    Controls/Buttons im Design-System — kein volles Pill/999px, das wäre ein
    neuer, unbegründeter Wert)
  - `font-size: 0.8rem`, `font-weight: 600`
  - Status "aktiv": `background: rgba(47, 122, 63, 0.12)` (abgeleitet aus
    `--color-status-active`, 12% Deckkraft analog zum bestehenden
    `.navLinkActive`-Muster in `AppShell.module.css`, das ebenfalls
    Vollton-Farbe + transparentem Hintergrund kombiniert),
    `color: var(--color-status-active)`
  - Status "abgelaufen": `background: rgba(156, 163, 175, 0.15)`,
    `color: var(--color-status-expired)` — hier zusätzlich
    `color: var(--color-text-secondary)` statt des Grau-Tons erwägen, falls
    Kontrast auf Weiß zu niedrig ist (siehe Accessibility unten)
  - Label-Text exakt "aktiv" / "abgelaufen" (unverändert, entspricht bereits
    den vorhandenen Werten in `ContractRow`)
- Kein neues Farb-Token nötig — beide Stati sind durch bestehende Tokens
  abgedeckt.

### Responsive Verhalten
- Kein zusätzliches Verhalten nötig — durch Wechsel auf `DataTable` erbt die
  Seite automatisch deren `overflow-x: auto`-Verhalten (`DataTable.module.css`
  `.tableContainer`, `min-width: 480px`) statt der aktuell komplett
  unresponsiven rohen `<table>`.

### Accessibility
- `role="status"` für den Sync-Hinweis bleibt erhalten (bereits korrekt
  umgesetzt).
- Badge ist nur farblich + textlich kodiert (Text "aktiv"/"abgelaufen" bleibt
  immer sichtbar, keine reine Farbkodierung) — erfüllt WCAG "nicht nur über
  Farbe".
- Kontrast prüfen: `--color-status-expired: #9ca3af` auf Weiß hat
  vermutlich < 4.5:1 (grober Schätzwert) für Fließtext-Kontrast. Da der
  Badge-Text bei "abgelaufen" ohnehin fett/klein ist, im Zweifel
  `color: var(--color-text-secondary)` (`#6b7280`, dunkler, besserer
  Kontrast) statt `--color-status-expired` für den Badge-**Text**
  verwenden, `--color-status-expired` nur für den Hintergrund-Ton. Exakte
  Kontrastmessung ist Developer-Aufgabe bei Umsetzung.

### Konsistenz-Hinweise
- Gleiche Card/DataTable-Kombination wie `DeliveryAuthorizationsListPage`.
- Gleiches Leer-/Sync-Text-Farbschema (`--color-text-secondary`).
- Badge-Muster (Vollton-Text auf transparentem Farb-Hintergrund) folgt
  demselben Prinzip wie `AppShell`s `.navLinkActive`.

---

## Login-Seite (`LoginPage.tsx` + `LoginPage.module.css`)

Grundprinzip: **visuelles Konzept bleibt vollständig erhalten**
(Sonnenuntergangs-Gradient-Hintergrund, zentrierte Glassmorphism-Card,
Warmton-Akzentfarbe für Button/Kicker) — nur die technische Umsetzung
wechselt wo möglich von Hex-Literalen auf vorhandene Tokens. Login ist kein
"Portal"-Screen wie Kontrakte/Lieferberechtigungen, sondern bewusst ein
eigenständiger, atmosphärischer Einstiegspunkt — das rechtfertigt die unten
gelisteten bewussten Ausnahmen.

### `.page` (Hintergrund)
- **Bewusste Ausnahme, nicht auf Tokens umstellen**: der gesamte
  Sonnenuntergangs-Gradient (`radial-gradient(...)` + `linear-gradient(...)`
  mit den Farbstopps `#6d8fac`, `#9fb9cc`, `#d9c2a3`, `#eeb26e`, `#c98a4b`,
  `#33422a`, `#1b230f`, `#10150a`) ist kein UI-Element im Sinne des
  Design-Systems (keine Fläche/Card/Text), sondern eine einmalige
  atmosphärische Bild-Ersatz-Grafik. `tokens.css` enthält keine mehrstufige
  Gradient-Palette und soll auch keine bekommen, nur um diesen einen
  Hintergrund abzudecken. Unverändert lassen.
- `font-family`: **umstellen** auf `var(--font-family-base)` statt der
  identisch dupliziert notierten Font-Stack-Liste — inhaltlich bereits
  identisch mit `tokens.css`, nur nicht referenziert.
- `padding: 24px` → **umstellen** auf `var(--space-4)` (24px, exakt
  deckungsgleich).

### `.card`
- `border-radius: 16px` → **umstellen** auf `var(--radius-card)` (16px,
  exakt deckungsgleich mit dem Card-Radius des Design-Systems).
- `padding: 40px 32px` → **beibehalten als bewusste Ausnahme**: großzügigeres
  Innen-Padding als das Standard-`Card`-Padding (`var(--space-4)` = 24px),
  passend zum zentrierten, "hero-artigen" Charakter der Login-Card. Falls
  Vereinheitlichung gewünscht ist, käme `var(--space-5)` (32px) für die
  horizontale Achse in Frage — vertikal (40px) gibt es keinen passenden
  Token; hier keine Erzwingung eines Tokens um jeden Preis.
- `box-shadow: 0 24px 60px rgba(20, 20, 10, 0.35)` → **bewusste Ausnahme,
  nicht auf `--shadow-card` umstellen**: `--shadow-card` ist für Cards auf
  hellem `--color-background` kalibriert (dezenter Schatten). Die
  Login-Card schwebt über einem sehr dunklen Gradient-Hintergrund und
  braucht einen deutlich stärkeren, wärmeren Schatten für Tiefenwirkung —
  fachlich identisches Prinzip (Schatten unter einer erhöhten Fläche), aber
  andere Kalibrierung. Als benannte Ausnahme dokumentieren statt
  stillschweigend abweichen zu lassen.
- `background: rgba(255, 255, 255, 0.9)` + `backdrop-filter: blur(12px)`:
  **bewusste Ausnahme**, kein Token in `tokens.css` deckt Transparenz/
  Blur ab (`--color-surface` ist vollständig opak `#ffffff`) — Glassmorphism-
  Effekt ist ausdrücklich Login-spezifisch, kein wiederverwendbares
  Design-System-Muster. Unverändert lassen.

### `.kicker`
- `color: #b3652b` → **bewusste Ausnahme**: warmer Akzentton, der zur
  Sonnenuntergangs-Palette passt, hat keine Entsprechung unter den
  Text-/Brand-Tokens (`--color-brand` ist das Öko-Grün, würde hier
  stilistisch nicht zum Warmton-Konzept passen). Unverändert lassen.
- Typografie (`font-size: 0.75rem`, `font-weight: 600`,
  `letter-spacing: 0.08em`, `text-transform: uppercase`): keine
  Token-Entsprechung in `tokens.css` (keine Typografie-Skala definiert) —
  unverändert lassen, kein neuer Typografie-Token nur hierfür.

### `.heading`
- `color: #22281c` → **umstellen** auf `var(--color-text-primary)`
  (`#1f2937`). Farbwert nicht identisch, aber im selben dunklen
  Grauton-Bereich und funktional gleichbedeutend ("primärer Text") —
  Vereinheitlichung sinnvoller als ein zweites "primärer Text"-Grau zu
  pflegen.
- `font-size`/`font-weight`: unverändert (keine Typografie-Tokens
  vorhanden).

### `.description`
- `color: #4b5563` → **umstellen** auf `var(--color-text-secondary)`
  (`#6b7280`). Nicht exakt identisch, aber funktional dieselbe Rolle
  ("sekundärer Fließtext") — ein Grauton-System statt zwei parallelen
  pflegen.

### `.button`
- `background: linear-gradient(135deg, #e08a3c, #b85c1f)` → **bewusste
  Ausnahme**: Warmton-Gradient passt zum Sonnenuntergangs-Konzept, hat keine
  Entsprechung zu `--color-brand` (Grün) und soll keine bekommen — ein
  grüner Login-Button würde den bewusst eigenständigen Charakter der Seite
  brechen. Unverändert lassen.
- `border-radius: 10px` → **umstellen** auf `var(--radius-control)` (10px,
  exakt deckungsgleich).
- `padding: 12px 20px` → keine 1:1-Token-Entsprechung
  (`var(--space-3)` = 16px, `var(--space-4)` = 24px, beides ungenau) —
  unverändert lassen statt ungenauer Annäherung.
- Hover-Schatten `0 10px 24px rgba(184, 92, 31, 0.35)`: **bewusste
  Ausnahme**, an die Button-Akzentfarbe gekoppelter Farbschatten, keine
  Design-System-Entsprechung. Unverändert lassen.

### `.error`
- `border-radius: 8px` → keine exakte Token-Entsprechung
  (`--radius-control` = 10px, `--radius-card` = 16px) — **umstellen auf
  `var(--radius-control)`** (10px) trotz kleiner Abweichung, um nicht einen
  dritten Radius-Wert im System zu etablieren; visuell vernachlässigbarer
  Unterschied (8px vs. 10px) bei einer so kleinen Fläche.
- `padding: 10px 14px` → **umstellen** auf `var(--space-2) var(--space-3)`
  (8px 16px) — nächstliegende Token-Kombination, Abweichung ebenfalls
  vernachlässigbar.
- `margin: 16px 0 0` → **umstellen** auf `var(--space-3) 0 0` (exakt
  deckungsgleich, 16px).
- `background: rgba(220, 38, 38, 0.08)` / `color: #b91c1c`: **bewusste
  Ausnahme**, kein Fehler-/Error-Token in `tokens.css` vorhanden. Kein neuer
  Token nur für diesen einen Anwendungsfall vorgeschlagen (Fehlermeldungen
  kommen aktuell nur auf dieser Seite in dieser Form vor) — siehe "Offene
  Fragen" für den Fall, dass weitere Seiten künftig Fehlerzustände in
  diesem Stil brauchen.

### Zusammenfassung Login (nur zur Übersicht)
| Wert | Aktuell | Neu |
|---|---|---|
| `.page` font-family | dupliziert | `var(--font-family-base)` |
| `.page` padding | `24px` | `var(--space-4)` |
| `.card` border-radius | `16px` | `var(--radius-card)` |
| `.heading` color | `#22281c` | `var(--color-text-primary)` |
| `.description` color | `#4b5563` | `var(--color-text-secondary)` |
| `.button` border-radius | `10px` | `var(--radius-control)` |
| `.error` border-radius | `8px` | `var(--radius-control)` |
| `.error` padding | `10px 14px` | `var(--space-2) var(--space-3)` |
| `.error` margin-top | `16px` | `var(--space-3)` |
| Gradient-Hintergrund, Glass-Effekt, Kicker-/Button-Warmton, Card-Schatten, Card-/Button-Padding | — | bewusste Ausnahme, unverändert |

### Accessibility
- Bestehendes Verhalten bereits korrekt: `role="alert"` für Fehlermeldung.
- Kontrast Button-Text (weiß) auf Gradient `#e08a3c → #b85c1f`: dunklerer
  Endpunkt (`#b85c1f`) sollte ausreichend Kontrast bieten, hellerer
  Startpunkt (`#e08a3c`) grenzwertig — bei Umsetzung Kontrast an der
  hellsten Stelle des Gradients prüfen (Developer-Aufgabe).
- Kicker-Farbe `#b3652b` auf halbtransparentem Weiß (`rgba(255,255,255,0.9)`)
  vor dunklem Hintergrund: Kontrast dürfte ausreichen, aber bei Umsetzung
  gegen tatsächlichen Hintergrund-Blend prüfen.

---

## Navigation/AppShell (`AppShell.tsx` + `AppShell.module.css`)

Kurzer Check, keine grundlegenden Probleme gefunden — Navigation nutzt
bereits durchgängig Tokens (`--space-*`, `--radius-control`,
`--shadow-card`, `--color-brand`, `--color-text-secondary`).

- Einzige Beobachtung: `.navLinkActive` verwendet `rgba(79, 138, 61, 0.1)`
  als literalen, aus `--color-brand` (`#4f8a3d`, entspricht `rgb(79, 138,
  61)`) abgeleiteten Farbwert statt einer Funktion/Variable — funktional
  unproblematisch (CSS Custom Properties können nicht direkt mit
  `rgba()`-Alpha kombiniert werden ohne zusätzliche `--color-brand-rgb`-
  Kanal-Variable), aber als Muster bereits identisch zu dem oben für den
  Kontrakte-Status-Badge vorgeschlagenen Ansatz ("Vollton-Farbe + separat
  notierter transparenter Hintergrund") — **kein Änderungsbedarf**, dient
  im Gegenteil als Bestätigung, dass dieses Muster im Projekt bereits
  etabliert ist.
- Kein Änderungsbedarf bei aktivem Link-Zustand, Spacing oder Struktur.

---

## Offene Fragen an Architect/Developer

- Sobald `ContractsListPage` echte Daten aus `apps/api` statt `DEMO_DATA`
  lädt (siehe Kommentar in `App.tsx`): Lade-/Fehlerzustand-Verhalten
  (`role="status"`/`role="alert"`, Loading-Text) analog zu
  `DeliveryAuthorizationsListPage`/`DataTable` übernehmen? Das ist
  Datenanbindungs-/Architektur-Scope, nicht Layout-Entscheidung dieser
  Review.
- Falls künftig weitere Seiten (Abnahmescheine, Belege) ebenfalls
  Fehlermeldungen im `.error`-Stil der Login-Seite brauchen: lohnt sich
  dann ein neues Token-Paar `--color-danger-bg` / `--color-danger-text`?
  Für diese Review (nur 2 betroffene Bestandsseiten) nicht vorgeschlagen,
  da aktuell nur ein einziger Verwendungsort existiert.
- Exakte Kontrastwerte (WCAG AA) für Status-Badge "abgelaufen" und für den
  Login-Button-Farbverlauf sind rechnerisch/Tool-gestützt zu verifizieren
  (Empfehlung oben ist eine Einschätzung, keine gemessene Prüfung).

---

## Umsetzungsreihenfolge

1. **Kontrakte-Seite**: `ContractsListPage.tsx` auf `Card` + `DataTable`
   umstellen, `ContractsListPage.module.css` (neu) für Status-Badge
   anlegen, Badge-Logik aus `ContractRow` in Spalten-`render`-Funktion der
   `DataTable`-Columns verschieben.
2. **Login-Seite**: `LoginPage.module.css` gemäß Tabelle oben auf Tokens
   umstellen (rein CSS-Wert-Ersetzung, keine strukturelle Änderung an
   `LoginPage.tsx` nötig).
3. **Navigation/AppShell**: keine Änderung erforderlich — nur zur
   Vollständigkeit geprüft.
