# 0002. Serverseitige Mandantentrennung für lieferantenscoped Ressourcen (Kontrakte)

## Status
Vorgeschlagen

## Kontext
Akzeptanzkriterium 4 der Backlog-Story
["lieferant-kontrakte-einsehen"](../../backlog/lieferant-kontrakte-einsehen.md)
fordert, dass ein Lieferant ausschließlich seine eigenen Kontrakte sehen
kann, und dass Zugriffsversuche auf fremde Kontrakte (z. B. per
URL-/ID-Manipulation) **serverseitig** mit einem Fehlerstatus (z. B.
403) abgelehnt werden — eine rein UI-seitige Filterung genügt
ausdrücklich nicht. Das Domain-Glossar schreibt für Kontrakt (und
weitere Entitäten) explizit lieferantenscharfe Mandantentrennung vor.
`docs/architecture/overview.md` listet das
"Authentifizierungs-/Autorisierungsmodell für Lieferanten
(Mandantentrennung)" als offene Grundsatzentscheidung; diese Story
benötigt zwingend den Autorisierungs-/Scoping-Teil davon, um AC4
umzusetzen.

Diese ADR entscheidet **ausschließlich das
Autorisierungs-/Scoping-Muster** für lieferantenbezogene
Leseressourcen in `apps/api`. Sie entscheidet **nicht** das vollständige
Authentifizierungsmodell (z. B. Wahl eines Identity Providers,
Session- vs. Token-Speicherung im Web-Client, Token-Bibliothek,
Passwortrichtlinien). AC7 setzt voraus, dass ein Login-Mechanismus
bereits existiert oder parallel entsteht ("wird zur Anmeldeseite
weitergeleitet"); dessen konkrete Ausgestaltung ist nicht Teil dieser
Entscheidung und bleibt in `overview.md` als offener Punkt bestehen,
soweit er über die Kontrakt-Autorisierung hinausgeht.

## Entscheidung
1. **Tenant-Identität kommt ausschließlich aus dem verifizierten
   Auth-Kontext, nie aus Client-Eingaben.** Es wird angenommen, dass
   beim erfolgreichen Login ein Token/Session-Kontext ausgestellt wird,
   der einen serverseitig gesetzten `supplierId`-Claim enthält (siehe
   offene Annahme). Alle lieferantenscoped Endpunkte (Kontrakt-Liste/
   -Detail) leiten die aktive `supplierId` ausschließlich aus diesem
   verifizierten Kontext ab — niemals aus Pfad-Parametern,
   Query-Parametern oder Request-Body.
2. **Routengestaltung ohne Lieferanten-ID im Pfad.** Endpunkte werden
   als `GET /contracts` (Liste) und `GET /contracts/:contractId`
   (Detail) ausgelegt (implizit "meine Kontrakte"), nicht als
   `GET /suppliers/:supplierId/contracts`. Damit entfällt die
   Angriffsfläche der Supplier-ID-Manipulation auf Listenebene
   vollständig.
3. **Guard + Repository-Filter als Defense-in-Depth.** Ein
   Autorisierungs-Guard validiert den Auth-Kontext und reichert den
   Request um die verifizierte `supplierId` an. Die Service-/
   Repository-Schicht filtert zusätzlich **jede** Kontrakt-Abfrage
   serverseitig nach `supplierId` (z. B.
   `WHERE contractId = :id AND supplierId = :tokenSupplierId`) — die
   Autorisierung wird also nicht nur im Controller, sondern auch auf
   Datenzugriffsebene erzwungen, damit ein versehentlich falsch
   verdrahteter Endpunkt keine fremden Daten preisgibt.
4. **Statuscode-Verhalten für Detail-Zugriff (AC4).** Bei
   `GET /contracts/:contractId`: existiert kein Kontrakt mit dieser ID,
   wird `404` zurückgegeben. Existiert der Kontrakt, gehört aber einem
   anderen Lieferanten, wird `403` zurückgegeben. Das erfordert intern
   zwei Prüfschritte (Existenzprüfung ohne Supplier-Filter, danach
   Ownership-Prüfung) ausschließlich zum Zweck der korrekten
   Statuscode-Wahl gemäß AC4 — die Kontraktdaten selbst werden im
   403-Fall in keinem Fall ausgeliefert.
5. **Kein Vertrauen auf UI-seitige Filterung.** `apps/web` zeigt
   ausschließlich, was die API liefert; jegliche
   Autorisierungsentscheidung ist serverseitig final und wird nicht
   durch Frontend-Logik dupliziert oder ersetzt.

## Konsequenzen
- Jeder künftige lieferantenscoped Endpunkt (auch außerhalb dieser
  Story) sollte demselben Muster folgen (Guard + Repository-Filter,
  keine Supplier-ID im Client-Input) — das etabliert einen
  wiederverwendbaren Sicherheitsstandard für das gesamte Projekt.
- Der 403-vs-404-Unterschied bedeutet, dass über wiederholtes Testen
  von IDs die reine Existenz einer Kontrakt-ID unterscheidbar wird
  (Informationsleck über Existenz, nicht über Inhalt). Das ist ein
  bewusster Trade-off zugunsten der expliziten AC4-Vorgabe ("z. B.
  403"); Security/QA sollten dieses Verhalten gezielt prüfen und
  akzeptieren oder in einer Folge-ADR auf einheitliches 404 umstellen,
  falls das Informationsleck als inakzeptabel bewertet wird.
- Diese ADR löst nur den für diese Story zwingend nötigen Teil des
  offenen Punkts "Authentifizierungs-/Autorisierungsmodell" aus
  `overview.md`. Die Wahl des konkreten Auth-Mechanismus (Token- vs.
  Session-basiert, IdP, Token-Lebensdauer/Refresh) bleibt offen und ist
  Gegenstand einer künftigen Entscheidung, sobald eine Story (z. B.
  Login) das zwingend benötigt.
- Risiko: Wird der Login-/Auth-Mechanismus später anders implementiert
  als angenommen, bleibt Punkt 1 (verifizierte serverseitige
  Supplier-Identität, keine Client-Eingabe) unverändert gültig; nur die
  technische Ausprägung des Auth-Kontexts ändert sich.

## Offene Annahmen
- Es wird angenommen, dass beim Login ein Mechanismus existiert oder
  parallel entsteht, der eine verifizierte `supplierId` pro
  Session/Token bereitstellt; die konkrete Login-Implementierung ist
  nicht Teil dieser ADR.
- Ein Rollenmodell für interne Sachbearbeiter (falls diese später
  ebenfalls über die API zugreifen) ist nicht Teil dieser Entscheidung
  — laut Backlog explizit als Nicht-Ziel/offene Frage für diese Story
  ausgeklammert.

## Datenklassifizierung
- **Kontrakt** (`Contract`): Ja, kommerziell/finanziell sensibel laut
  Domain-Glossar — Hauptgrund für strikte Mandantentrennung in dieser
  ADR.
- **Lieferant** (`Supplier`): Ja, Stammdaten-sensibel — trägt die
  Tenant-Identität (`supplierId`), über die die Autorisierung erfolgt.
