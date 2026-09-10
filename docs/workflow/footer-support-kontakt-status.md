# Pipeline-Status: Footer mit Support-Kontakt

Datum: 2026-09-10

## Schritte
| Schritt | Rolle | Output-Datei | Status |
|---|---|---|---|
| 1 | Product Owner | docs/backlog/footer-support-kontakt.md | OK |
| 2 | UX/UI Architect | docs/design/footer-support-kontakt.md | OK |
| 3 | Architect | docs/architecture/adr/0010-footer-support-kontakt.md | OK |
| 4 | Developer | apps/web/src/design-system/Footer.tsx, Footer.module.css, Footer.spec.tsx; apps/web/src/App.tsx (geändert) | OK |
| 5 | QA | docs/qa/footer-support-kontakt.md | OK |
| 6 | Security | docs/security/footer-support-kontakt.md | OK |
| 7 | DevOps | docs/devops/footer-support-kontakt.md | OK |
| 8 | Documentation | docs/product/footer-support-kontakt.md | OK |

## Zusammenfassung

Das Web-Frontend (`apps/web`) erhält einen neuen, App-weiten Footer, der
auf jeder Seite — eingeloggt (Portal/`AppShell`) und nicht eingeloggt
(`LoginPage`, `AuthCallbackPage`) — die statische Support-Kontakt-Adresse
`support@myemsland.de` als `mailto:`-Link anzeigt. Die zentrale
architektonische Entscheidung (ADR 0010) verankert den neuen Baustein
`Footer` bewusst auf App-Root-Ebene in `App.tsx` statt nur innerhalb von
`AppShell`, da sonst AC2 (Sichtbarkeit auf der Login-Seite) verletzt worden
wäre — eine Präzisierung, die UX/UI Architect, Architect, Developer und QA
konsistent durchgezogen haben. Alle 9 Akzeptanzkriterien sind laut QA
verifiziert (55/55 Tests grün, Typecheck/Build grün), Security hat das
Feature ohne kritische/hohe/mittlere Befunde freigegeben (keine
personenbezogenen/finanziellen Lieferantendaten betroffen), und DevOps
bestätigt, dass die bestehende CI (`ci.yml`) das Feature ohne Änderung
abdeckt und keine neuen Secrets/Umgebungsvariablen nötig sind. Es wurde
weder eine neue Bibliothek noch ein neuer Design-Token eingeführt (AC4/AC5).

## Offene Risiken / Blocker

Keine. QA: Freigabe-Status "Bestanden", keine blockierenden Befunde (zwei
nicht-blockierende Hinweise: AC6/Responsive nur statisch geprüft ohne
Viewport-/E2E-Test; AC8-Wortlaut bewusst abweichend, aber in ADR 0010
dokumentiert ausgelegt). Security: Freigabe-Status "Freigegeben", keine
kritischen/hohen/mittleren Befunde (zwei niedrig eingestufte, nicht
blockierende Hinweise: öffentliche Sichtbarkeit der Adresse vor Login als
bewusste fachliche Entscheidung; vorsorglicher `rel="noopener noreferrer"`-
Hinweis für eine etwaige künftige `target="_blank"`-Erweiterung).

Kleinere, nicht blockierende Abweichung vom Pipeline-Ablauf: Der
Architect-Agent hat zusätzlich zur ADR (wie in seiner Rollendefinition
vorgesehen) auch `docs/architecture/overview.md` aktualisiert; das ist kein
Fehler, aber über die von `/orchestrate` explizit geprüfte Mindestanforderung
(neue ADR-Datei) hinausgehend und wird hier der Vollständigkeit halber
vermerkt.

## Nächste Schritte

- Vor Go-Live klären, ob `support@myemsland.de` bereits die final
  freigegebene Support-Adresse ist oder ein Platzhalter (offene Frage aus
  Backlog/Product-Dokumentation) — ggf. erneuter, einfacher Code-Change
  ohne neue Architektur-/Security-Prüfung nötig.
- Änderungen (Developer-Code, alle `docs/`-Artefakte) sind auf dem Branch
  `claude/extranet-multi-role-agents-m9g1vh` committet und gepusht; ein
  Draft-PR wird im Anschluss an diesen Bericht erstellt/aktualisiert.
- Optional, außerhalb des Scopes dieser Story: visueller/E2E-Viewport-Test
  für AC6 nachholen, falls künftig eine Playwright-/Cypress-Teststrecke für
  `apps/web` eingerichtet wird (siehe QA-Hinweis).
