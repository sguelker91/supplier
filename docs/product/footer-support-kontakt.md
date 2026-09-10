# Footer mit Support-Kontakt

## Für Lieferanten

Auf jeder Seite des Lieferanten-Extranets im Web-Browser sehen Sie ab sofort
am unteren Seitenrand einen schmalen Footer mit unserer Support-Kontakt-
Adresse: **support@myemsland.de**.

- Der Footer ist auf **allen** Seiten sichtbar — sowohl auf der Anmeldeseite
  (bevor Sie sich einloggen) als auch auf allen Seiten innerhalb des
  eingeloggten Portalbereichs (z. B. Kontrakte, Lieferberechtigungen).
- Die E-Mail-Adresse ist als Link ausgeführt: Ein Klick bzw. Tippen darauf
  öffnet Ihr Standard-E-Mail-Programm mit `support@myemsland.de` bereits als
  Empfänger vorausgefüllt.
- Der Footer funktioniert auch mit der Tastatur und mit Screenreadern: Der
  Link ist per Tastatur erreichbar, zeigt einen sichtbaren Fokusrahmen, und
  sein Text ist die vollständige, gut verständliche E-Mail-Adresse (kein
  unklares "hier klicken").
- Der Footer passt sich der Bildschirmbreite an (Desktop, Tablet, schmales
  Browserfenster) und bleibt dabei immer vollständig lesbar.

Was der Footer **nicht** enthält: keine Telefonnummer, keine Postanschrift,
keine Öffnungszeiten, kein Kontaktformular oder Chat, kein Impressum und
keine lieferantenspezifischen Daten (z. B. keine Angaben zu Ihren Kontrakten,
Lieferberechtigungen, Belegen oder Mengenmeldungen). Es handelt sich um eine
rein informative Anzeige einer festen Kontaktadresse — es werden dabei keine
personenbezogenen oder finanziellen Daten verarbeitet oder gespeichert.

Hinweis: `support@myemsland.de` ist laut Backlog-Story derzeit als Adresse
hinterlegt; ob dies bereits die endgültige, final freigegebene Support-
Adresse ist, war zum Zeitpunkt der Umsetzung noch offen (siehe "Offene
Fragen" in `docs/backlog/footer-support-kontakt.md`).

## Für Entwickler

**Umsetzung** (Web-Frontend, `apps/web`, ausschließlich):

- Neuer Design-System-Baustein `apps/web/src/design-system/Footer.tsx`
  (+ `Footer.module.css`, + `Footer.spec.tsx`): zustandslose
  Präsentationskomponente ohne Props. `SUPPORT_LABEL`
  ("Support-Kontakt:") und `SUPPORT_EMAIL` (`support@myemsland.de`) sind
  feste Modul-Konstanten — keine Konfigurierbarkeit über Props, Umgebungs-
  variablen oder Backend. Natives `<footer>`-Element (ARIA-Landmark
  `contentinfo`), Adresse als `<a href="mailto:support@myemsland.de">` mit
  sichtbarem Linktext = Accessible Name.
- `Footer.module.css` verwendet ausschließlich bestehende Design-Tokens
  (`--bg`, `--border`, `--color-text-secondary`, `--accent`,
  `--space-2/3/4`) sowie den bereits im Code vorhandenen Wert `0.85rem`
  (Präzedenzfall `AppShell.module.css` `.navLink`) — keine neuen Tokens,
  keine neue Bibliothek.
- Einhängung in `apps/web/src/App.tsx`: `<Footer />` als Geschwister-
  Element der äußeren `<Routes>`, innerhalb von `<BrowserRouter>`, aber
  außerhalb von `Portal()`/`AppShell`/`ProtectedArea`. Dadurch genau eine
  Footer-Instanz, unabhängig vom Auth-Zustand sichtbar (eingeloggtes
  Portal, `LoginPage`, `AuthCallbackPage`).
- Automatisierter Test in `Footer.spec.tsx` (React Testing Library):
  prüft Rendering, `contentinfo`-Landmark und `mailto:`-Link mit korrekter
  Adresse/Accessible Name.

**Architektur-Entscheidung:** Die Platzierung auf App-Root-Ebene statt
innerhalb von `AppShell` ist in
[ADR 0010](../architecture/adr/0010-footer-support-kontakt.md) begründet und
verbindlich festgelegt (Login-Seite und `AuthCallbackPage` liegen außerhalb
von `AppShell`, ein reiner `AppShell`-interner Footer hätte diese Seiten
nicht abgedeckt).

**Qualitätssicherung:** QA-Freigabe "Bestanden" (`docs/qa/footer-support-kontakt.md`,
alle 9 Akzeptanzkriterien verifiziert, 55/55 Tests grün, Typecheck und
Produktionsbuild erfolgreich). Security-Freigabe "Freigegeben"
(`docs/security/footer-support-kontakt.md`) — keine kritischen/hohen/mittleren
Befunde; zwei niedrige, nicht blockierende Hinweise (öffentliche Sichtbarkeit
der Adresse vor Login als bewusste fachliche Entscheidung; vorsorglicher
Hinweis zu `rel="noopener noreferrer"` bei künftiger `target="_blank"`-
Erweiterung). Keine personenbezogenen oder finanziellen Lieferantendaten
betroffen, keine vertiefte DSGVO-Prüfung erforderlich.

**DevOps:** Keine Änderung an `.github/workflows/ci.yml` nötig — bestehender
`test`- und `build`-Job für `apps/web` deckt die neuen/geänderten Dateien
automatisch ab (Path-Filter `apps/**`). Keine neue Abhängigkeit, keine neuen
Secrets, keine neue Umgebungsvariable, kein Deploy-Workflow im Repo für
`apps/web` vorhanden (Details: `docs/devops/footer-support-kontakt.md`).

**Scope-Hinweis:** Betrifft ausschließlich `apps/web`. `apps/mobile` ist
laut Backlog-Story explizit kein Bestandteil dieser Umsetzung.

## Changelog

- 2026-09-10: Footer mit statischer Support-Kontakt-Adresse
  (`support@myemsland.de`, `mailto:`-Link) auf App-Root-Ebene in
  `apps/web` eingeführt, sichtbar auf allen Seiten unabhängig vom
  Login-Status.
