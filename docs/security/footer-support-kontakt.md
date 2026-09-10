# Security-Bericht: Footer mit Support-Kontakt

Bezug: `docs/backlog/footer-support-kontakt.md`, `docs/architecture/adr/0010-footer-support-kontakt.md`, `docs/qa/footer-support-kontakt.md`.

Geprüfte Artefakte (eigene Code-Sichtung, nicht nur Übernahme der Vorbefunde):
- `apps/web/src/design-system/Footer.tsx`
- `apps/web/src/design-system/Footer.module.css`
- `apps/web/src/design-system/Footer.spec.tsx`
- `apps/web/src/App.tsx`
- `docs/domain-glossar.md` (Sensibilitäts-Flags)

## Bedrohungsmodell (kurz)

Der Footer ist eine zustandslose Präsentationskomponente ohne Props, ohne Datenfluss und ohne Netzwerk-/Store-Zugriff (`SUPPORT_LABEL`, `SUPPORT_EMAIL` sind feste Modul-Konstanten in `Footer.tsx`). Er wird gemäß ADR 0010 einmal auf App-Root-Ebene eingehängt (Geschwister der äußeren `<Routes>` in `App.tsx`) und erscheint dadurch unabhängig vom Auth-Zustand (`AppShell`-Portal, `LoginPage`, `AuthCallbackPage`).

Relevante Angriffsflächen wurden entlang der vier Standard-Prüfachsen der Rolle betrachtet:

- **Mandantentrennung**: Kein `useAuth()`-Zugriff, kein GPA-/Supplier-Bezug, keine Personalisierung — der Footer rendert für jeden Lieferanten und auch für nicht authentifizierte Besucher identisches, statisches Markup. Es gibt keinen Datenfluss, der überhaupt fehlerhaft mandantenübergreifend sein könnte.
- **Injection/Upload**: Kein Formular, kein Datei-Upload, kein Nutzer-Input, kein `dangerouslySetInnerHTML`. Die `mailto:`-URL wird ausschließlich aus der festen Konstante `SUPPORT_EMAIL` per Template-String gebildet, nicht aus Props/State/URL-Parametern — kein Angriffsvektor für URL-/Header-Injection über den Link.
- **Lobster/ERP-Systemgrenze**: Kein Bezug. Der Footer liest weder ERP- noch Lobster-Daten; die Story schließt das explizit als Nicht-Ziel aus, und der Code bestätigt dies (keine Imports aus API-/Lobster-Modulen, keine `fetch`/Store-Zugriffe in `Footer.tsx`).
- **Authentifizierung/Autorisierung**: Der Footer liegt bewusst außerhalb von `ProtectedArea`/`AppShell` und ist damit unauthentifiziert erreichbar (AC2). Das ist beabsichtigt (Support-Kontakt muss auch vor Login sichtbar sein) und stellt kein Autorisierungsproblem dar, da keine schützenswerten Daten transportiert werden. Zu prüfen war lediglich, ob durch die Root-Platzierung versehentlich andere, geschützte Inhalte mit "durchgereicht" werden — das ist laut Code-Review (`App.tsx` Z. 109–126) nicht der Fall: `<Footer />` ist ein reines Geschwister-Element ohne Zugriff auf `Portal()`-internen State.

Zusätzliches, nicht in Backlog/ADR/QA explizit betrachtetes Risiko: Öffentliche Exponierung einer Kontakt-E-Mail-Adresse auch für nicht authentifizierte Besucher (Login-Seite) — potenzielle Zielscheibe für Spam/Phishing gegen die Support-Mailbox. Das ist eine bewusste fachliche Entscheidung (Support muss vor Login erreichbar sein) und domänentypisch unkritisch, wird aber der Vollständigkeit halber als Befund aufgeführt.

## Befunde

| Schweregrad | Befund | Empfehlung |
|---|---|---|
| niedrig | `support@myemsland.de` wird auch unauthentifizierten Besuchern (Login-Seite, `AuthCallbackPage`) angezeigt und ist damit öffentlich harvestbar (Spam-/Phishing-Zielscheibe für die Mailbox). | Kein Blocker, da fachlich gewollt (AC2). Empfehlung: serverseitige Spam-/Phishing-Filterung für die Mailbox sicherstellen (organisatorische Maßnahme, außerhalb des Web-Frontend-Scopes). Keine Code-Änderung nötig. |
| niedrig | Der `<a href="mailto:...">`-Link nutzt keinen `target="_blank"` und daher auch kein `rel="noopener noreferrer"` — korrekt so, aber als Kontrollpunkt geprüft, damit später bei einer Erweiterung (z. B. Öffnen in neuem Tab) nicht versehentlich ein `window.opener`-Reverse-Tabnabbing-Risiko eingeführt wird. | Keine Aktion jetzt nötig; bei künftiger Änderung des Link-Verhaltens (`target="_blank"`) zwingend `rel="noopener noreferrer"` ergänzen. |
| informativ | Mandantentrennung, Auth/Autorisierung, Injection/Upload, Lobster/ERP-Grenze: kein Befund — Komponente ist vollständig statisch, prop- und statelos, ohne Datenfluss aus/zu Backend, ERP oder Lobster. | Kein Handlungsbedarf. Als Standing-Concern-Check dokumentiert (keine Regression durch spätere Erweiterung des Footers, z. B. Impressum/Datenschutzerklärung, ohne erneute Security-Prüfung). |
| informativ | Keine neue Abhängigkeit (AC5) — kein zusätzliches Supply-Chain-Risiko durch dieses Feature. | Kein Handlungsbedarf. |

Keine kritischen, hohen oder mittleren Befunde identifiziert.

## DSGVO-Bewertung

Sensible Felder laut `docs/domain-glossar.md` (Steuerbescheid, Prämie, Gutschrift, sowie GPA/Kontrakt/Lieferberechtigung/Abnahmeschein/Beleg) sind von diesem Feature **nicht betroffen** — eigene Code-Prüfung von `Footer.tsx`, `Footer.module.css`, `Footer.spec.tsx` und dem Diff in `App.tsx` bestätigt: keine dieser Entitäten wird referenziert, geladen, angezeigt oder gespeichert.

Verbleibende Bewertung bezogen auf die angezeigte E-Mail-Adresse selbst:

- **Rechtsgrundlage**: Es findet keine Verarbeitung personenbezogener Daten durch das Feature statt — die Komponente zeigt lediglich eine feste, funktionale (rollenbasierte, nicht personengebundene) Kontaktadresse (`support@myemsland.de`) an. Es werden keine Nutzer-/Lieferantendaten gelesen, übertragen oder gespeichert; eine Rechtsgrundlage nach Art. 6 DSGVO ist daher für diese Anzeige nicht erforderlich. Sobald ein Lieferant den `mailto:`-Link tatsächlich nutzt, entsteht eine E-Mail-Kommunikation zwischen Lieferant und Support — das ist jedoch ein Vorgang im E-Mail-System außerhalb des Extranet-Frontends und außerhalb des Scopes dieser Story/dieses Berichts.
- **Datensparsamkeit**: Erfüllt — es wird ausschließlich eine funktionale Kontaktadresse angezeigt, keine personenbezogenen Daten eines Support-Mitarbeiters (kein Name, keine Durchwahl), kein Tracking, kein Analytics-Aufruf im Zusammenhang mit dem Link.
- **Aufbewahrungsfristen**: Nicht anwendbar — es werden clientseitig keine Daten persistiert (kein LocalStorage, kein Cookie, kein State), die Adresse ist eine kompilierte Code-Konstante.
- **Auskunfts-/Löschrecht (Art. 15/17 DSGVO)**: Nicht anwendbar, da keine personenbezogenen Daten durch dieses Feature verarbeitet oder gespeichert werden, über die Auskunft erteilt oder die gelöscht werden müssten.

Fazit DSGVO: Die Einschätzung aus Backlog-Story und ADR 0010 ("keine vertiefte DSGVO-Prüfung erforderlich, da keine personenbezogenen/finanziellen Lieferantendaten betroffen") wird nach eigener Prüfung **bestätigt**. Einzige Randnotiz: Sollte die Support-Adresse künftig durch eine personenbezogene Adresse (z. B. `vorname.nachname@...`) ersetzt werden, wäre eine erneute, dann tatsächlich vertiefte DSGVO-Bewertung nötig — für den aktuellen, rollenbasierten Platzhalter (`support@...`) besteht dieser Bedarf nicht.

## Freigabe-Status

**Freigegeben**

Keine kritischen, hohen oder mittleren Befunde. Die zwei niedrig eingestuften Punkte (öffentliche Sichtbarkeit der Support-Adresse vor Login; vorsorglicher Hinweis zu `rel="noopener"` bei künftiger `target="_blank"`-Erweiterung) sind bewusste, dokumentierte fachliche Entscheidungen bzw. rein präventive Hinweise ohne aktuellen Code-Fehler und stellen kein Freigabehindernis dar. Mandantentrennung, Auth/Autorisierung, Injection-/Upload-Risiken und die Lobster/ERP-Systemgrenze sind für dieses rein statische UI-Feature nicht betroffen. DSGVO-Bewertung bestätigt keinen Handlungsbedarf.
