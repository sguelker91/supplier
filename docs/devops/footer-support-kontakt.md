# DevOps-Notiz: Footer mit Support-Kontakt (apps/web)

Bezug: `docs/architecture/adr/0010-footer-support-kontakt.md`,
`docs/backlog/footer-support-kontakt.md`,
`docs/security/footer-support-kontakt.md` (Freigabe-Status: Freigegeben,
keine Secrets-Implikationen).

**Vorab-Klarstellung zum bestehenden CI/CD-Stand** (selbst in
`.github/workflows/` geprüft, nicht nur übernommen): Im aktuellen Repo-Stand
existiert **ausschließlich** `.github/workflows/ci.yml`. Es gibt **keine**
Datei `deploy-api.yml` und **keinen** Deployment-/CD-Workflow (weder für
`apps/api` noch für `apps/web`) im Repository. Eine etwaige Annahme, es
existiere bereits ein (ggf. missverständlich benanntes) Deploy-Workflow, der
`apps/web` nach AKS ausrollt, kann ich anhand des tatsächlichen
Repo-Inhalts **nicht bestätigen** — ich dokumentiere hier nur, was
nachweislich vorhanden ist, und kennzeichne alles Weitere explizit als
Vorschlag.

## Pipeline-Änderungen

**Besteht bereits:** `.github/workflows/ci.yml` (ADR 0006) deckt dieses
Feature ohne jede Änderung ab:

- Trigger-Path-Filter `apps/**` greift automatisch für die neuen Dateien
  `apps/web/src/design-system/Footer.tsx`, `Footer.module.css`,
  `Footer.spec.tsx` sowie die geänderte `apps/web/src/App.tsx` — kein
  Anpassungsbedarf am Workflow.
- Job `test` (Matrix `web`): führt Lint, Typecheck und `npm test
  --workspace=apps/web` aus, inkl. der neuen `Footer.spec.tsx` (AC9).
- Job `build` (Matrix `web`): führt `npm run build --workspace=apps/web`
  aus und verifiziert damit, dass der Footer-Baustein produktiv baubar ist.
- Da laut Backlog-Story/ADR **keine neue Abhängigkeit** eingeführt wurde
  (AC5), ändert sich `package-lock.json` nicht — kein zusätzlicher
  Supply-Chain-Prüfschritt nötig.

**Kein CI vorhanden — Vorschlag:** Ein Deployment-Schritt für `apps/web`
existiert im Repo nicht. Für dieses Feature ist kein neuer Deploy-Workflow
zwingend erforderlich, um es umzusetzen; falls/wenn ein CD-Workflow für
`apps/web` künftig eingerichtet wird (separates Vorhaben, nicht Teil dieser
Story), reicht es aus, dass der bestehende `build`-Job als Vorstufe
wiederverwendet wird — es besteht kein spezifischer Zusatzbedarf durch den
Footer.

Kein zusätzlicher Accessibility- oder Visual-Regression-Check wird für
dieses Feature vorgeschlagen: Die Prüfung von Fokus-Reihenfolge,
Fokus-Indikator und Accessible Name (AC7) ist laut QA/Security bereits durch
`Footer.spec.tsx` (RTL) abgedeckt; ein zusätzliches Tool (z. B. axe-core,
Playwright) wäre ein Scope-Zuwachs, den weder ADR 0010 noch die Story
verlangen.

## Umgebungen / Konfiguration

- Der Footer verwendet **keine Umgebungsvariable** (bewusstes Nicht-Ziel
  der Story: "Keine Konfigurierbarkeit der E-Mail-Adresse"). `SUPPORT_LABEL`
  und `SUPPORT_EMAIL` sind feste Modul-Konstanten in `Footer.tsx` und damit
  in jedem Build-Artefakt identisch — Dev/Staging/Prod erhalten exakt
  denselben Footer-Inhalt, ohne Konfigurationsdrift zwischen Umgebungen.
- Es gibt daher **keinen** neuen Konfigurationsbedarf (kein neuer Eintrag in
  `.env`-Dateien, keine neue Build-Variante, kein Feature-Flag).
- **Offene fachliche Frage (nicht DevOps-Scope):** Laut Backlog ist noch
  ungeklärt, ob `support@myemsland.de` bereits die final freigegebene
  Adresse ist oder ein Platzhalter. Da die Adresse hart im Code steht, ist
  jede spätere Änderung ein regulärer Code-Change mit erneutem
  PR/CI-Durchlauf (kein Secrets-/Config-Rollout nötig) — das ist eine
  bewusste, in ADR 0010 dokumentierte Konsequenz des gewählten Ansatzes.

## Secrets-Handling

Für dieses Feature werden **keine Secrets** benötigt und **keine neuen
Secrets** eingeführt:

- Die angezeigte Adresse ist laut Security-Freigabe (`docs/security/
  footer-support-kontakt.md`) ein statischer, unternehmensseitiger
  Kontaktpunkt ohne Bezug zu ERP-/Lobster-Zugangsdaten, keine
  Authentifizierungs- oder API-Anbindung.
- Es gibt keinen Zugriff auf ERP/Lobster, keine neue Umgebungsvariable, kein
  Secret-Manager-Eintrag, kein CI-Secret (`secrets.*` in GitHub Actions) im
  Zusammenhang mit diesem Feature.
- Bestehende Secrets-Handling-Praxis für ERP-/Lobster-Zugangsdaten in
  anderen Teilen des Systems (z. B. ZITADEL-Konfiguration, siehe ADR 0004)
  ist von diesem Feature **nicht betroffen** und wird hier nicht verändert.

## Rollout-Plan

- **Merge nach `main`:** Löst automatisch `ci.yml` aus (Lint/Typecheck/Test/
  Build für `apps/web`, s. o.). Kein manueller Freigabeschritt über die
  bestehende CI hinaus erforderlich.
- **Deployment:** Da im Repo aktuell kein Deploy-Workflow für `apps/web`
  vorhanden ist, erfolgt der tatsächliche Rollout auf die
  Ziel-Infrastruktur (Hosting von `apps/web`) außerhalb dieser
  CI-Pipeline — der Mechanismus dafür ist im aktuellen Repo-Stand nicht
  dokumentiert und wird hier nicht vorausgesetzt. **Vorschlag**, falls ein
  Deploy-Workflow für `apps/web` eingerichtet wird: Das Build-Artefakt aus
  dem bestehenden `build`-Job kann unverändert übernommen werden, da der
  Footer keinen eigenen Build-Schritt benötigt.
- **Risikoeinschätzung:** Sehr geringes Rollout-Risiko — rein clientseitige,
  zustandslose UI-Ergänzung ohne neue Abhängigkeit, ohne Backend-/API-
  Änderung, ohne Datenmodell-Änderung, ohne neue Konfiguration. Kein
  Feature-Flag vorgesehen (unverhältnismäßig für diesen Umfang, YAGNI,
  konsistent mit ADR 0010).
- **Rollback:** Da keine Migration, kein Secret und keine
  Konfigurationsänderung beteiligt sind, genügt ein regulärer
  Git-Revert des Merge-Commits (betrifft ausschließlich `apps/web/src/
  design-system/Footer.tsx`, `Footer.module.css`, `Footer.spec.tsx`,
  `apps/web/src/App.tsx`) mit anschließendem Re-Deploy des vorherigen
  Build-Artefakts. Kein Datenverlust oder Zustandsproblem möglich, da die
  Komponente keinen Zustand hält und keine Daten persistiert.
- **Mobile:** Kein EAS-Build/App-Store/Play-Store-Bezug — die Story deckt
  laut Nicht-Ziel ausdrücklich nur `apps/web` ab, `apps/mobile` ist nicht
  betroffen.

## Monitoring / Alerting

- Kein neuer Alerting-Bedarf: Der Footer hat keinen Netzwerk-/API-Aufruf,
  keinen Fehlerzustand mit Serverbezug und keine Latenz-/Verfügbarkeits-
  Metrik, die überwacht werden müsste.
- **Vorschlag (kein bestehendes Monitoring-Setup im Repo dokumentiert):**
  Sofern für `apps/web` bereits ein clientseitiges Error-Monitoring
  existiert, deckt dieses Render-Fehler des Footers ohne zusätzliche
  Konfiguration mit ab; ein dediziertes Monitoring nur für den Footer wird
  nicht vorgeschlagen (unverhältnismäßig).
- Empfehlung für den Rollout-Zeitpunkt: manueller Smoke-Test nach
  Produktiv-Deployment (Footer auf Login-Seite und im eingeloggten
  Portalbereich sichtbar, `mailto:`-Link öffnet mit korrekter Adresse) — da
  kein automatisierter Post-Deploy-Check im Repo existiert.
- Organisatorischer Hinweis aus dem Security-Bericht (kein DevOps-Blocker,
  hier nur zur Vollständigkeit referenziert): Die öffentlich sichtbare
  Support-Adresse ist potenzielles Ziel von Spam/Phishing gegen die
  Mailbox; serverseitige Spam-/Phishing-Filterung der Mailbox liegt außerhalb
  des Web-Frontend- und CI/CD-Scopes dieser Story.
