# 0007. npm-Workspaces als Monorepo-Tooling, kein Turborepo/Nx (vorerst)

## Status
Vorgeschlagen

## Kontext
`docs/architecture/overview.md` listet unter "Offene technische
Entscheidungen" seit [ADR 0003](0003-monorepo-vs-polyrepo.md) die konkrete
Monorepo-*Tooling*-Wahl (Turborepo, Nx, npm-/pnpm-Workspaces) als letzte noch
offene Werkzeug-Grundsatzfrage neben Test-Framework und CI-Provider — beide
inzwischen entschieden ([ADR 0005](0005-test-framework.md): Jest einheitlich;
[ADR 0006](0006-github-actions-als-ci-provider.md): GitHub Actions, eine
Pipeline für das Monorepo).

Relevante Ausgangslage:

- Es existiert weiterhin **kein** `package.json`, kein Lockfile und kein
  lauffähiges Scaffolding in `apps/web`, `apps/mobile` oder `apps/api`. Diese
  ADR trifft die Werkzeug-Entscheidung, implementiert sie aber
  ausdrücklich nicht (siehe Aufgabenstellung; analog zum Vorgehen bei
  ADR 0003/0005/0006, die ebenfalls keine Konfigurationsdateien angelegt
  haben).
- Team-Realität wie bereits in ADR 0003 (Kriterium 3/4) und ADR 0006
  (Begründung 4) festgehalten: ein einzelner menschlicher Entwickler
  arbeitet mit der Agenten-Harness; es gibt kein Platform-/Build-Team,
  das eine komplexere Tooling-Investition (z. B. Nx-Generatoren,
  Turborepo-Remote-Caching-Setup) laufend pflegen würde.
- Die drei Apps sind technologisch heterogen: `apps/web` (React,
  Bundler noch offen — CRA/Vite nicht entschieden), `apps/mobile`
  (React Native/Expo, Metro-Bundler) und `apps/api` (NestJS/Node). Laut
  [ADR 0005](0005-test-framework.md) ist bereits bekannt, dass Expo/React
  Native an mehreren Stellen (Test-Runner, Modulauflösung) eigene,
  offiziell dokumentierte Erwartungen an die Umgebung stellt, von denen
  ein Abweichen als unbegründetes technisches Risiko bewertet wurde.
- [ADR 0006](0006-github-actions-als-ci-provider.md) hat die
  CI-Struktur bereits so festgelegt, dass Path-Filtering und
  Matrix-Builds **innerhalb einer GitHub-Actions-Pipeline** die pro-App-
  Ausführung steuern — nicht ein separates Monorepo-Tool mit eigenem
  Task-Graph. Das nimmt einen Teil des Nutzenversprechens von
  Turborepo/Nx (selektive Ausführung nach geänderten Pfaden) bereits
  vorweg, unabhängig vom hier gewählten Tooling.

Zwei Fragen sind eng verknüpft und werden hier gemeinsam entschieden, weil
sie sich gegenseitig bedingen:

1. **Workspace-Mechanismus / Paketmanager**: Wie werden `apps/web`,
   `apps/mobile`, `apps/api` (und ein potenzielles künftiges geteiltes
   Contract-Package, siehe ADR 0003) als ein zusammenhängender
   Dependency-Baum verwaltet? Kandidaten: npm-Workspaces,
   pnpm-Workspaces, Yarn-Workspaces (classic oder Berry).
2. **Task-Orchestrierungs-/Caching-Layer** (optional, zusätzlich zum
   Workspace-Mechanismus): Turborepo oder Nx, die auf einem der obigen
   Workspace-Mechanismen aufsetzen und zusätzlich Task-Graphen,
   inkrementelles/verteiltes Caching und Affected-Detection bieten.

## Entscheidung

### 1. Workspace-Mechanismus: npm-Workspaces
**npm-Workspaces** wird als Mechanismus zur Verwaltung von `apps/web`,
`apps/mobile` und `apps/api` als ein zusammenhängender Dependency-Baum
festgelegt. Damit ist implizit auch der Paketmanager entschieden: **npm**
(nicht pnpm, nicht Yarn).

Begründung:

1. **Kein zusätzliches Werkzeug.** npm ist mit jeder Node.js-Installation
   bereits vorhanden; npm-Workspaces sind ein natives npm-Feature (seit
   npm 7) ohne separate Installation, Konfigurationssprache oder
   zusätzliche Lernkurve über npm selbst hinaus. Für ein Ein-Personen-
   plus-Agenten-Team (ADR 0003, Kriterium 3/4) ist das der Ausgangspunkt
   mit dem geringsten zusätzlichen Betriebs- und Lernaufwand.
2. **Geringstes bekanntes Reibungsrisiko mit Expo/Metro.** Metro (der
   Bundler von React Native/Expo) erwartet standardmäßig ein klassisch
   gehoistetes `node_modules`-Layout; das entspricht dem Standardverhalten
   von npm- und Yarn-classic-Workspaces. pnpm verwendet dagegen
   standardmäßig strikte, symlink-basierte `node_modules`-Strukturen, die
   in der Vergangenheit zusätzliche Metro-Resolver-Konfiguration
   (`node-linker=hoisted` bzw. angepasste `metro.config.js`-Resolver)
   erforderten, um verlässlich zu funktionieren. Da laut ADR 0005 ein
   Abweichen von Expo-Standardpfaden ohne zwingenden Grund bereits als
   unbegründetes Risiko bewertet wurde, wird dieselbe Abwägung hier auf
   die Paketmanager-Wahl übertragen: npm vermeidet dieses
   Zusatzkonfigurationsrisiko von vornherein, statt es einzugehen und
   erst bei Bedarf zu lösen.
3. **Ausreichend für den aktuellen Bedarf.** Der in ADR 0003 benannte
   Hauptnutzen eines Monorepo-Tools an dieser Stelle ist der lokale
   Import geteilter TypeScript-Contracts (z. B. `Contract`-Typen aus
   ADR 0001) zwischen `apps/api` und den Frontends ohne
   Publishing-Schritt. Das leisten npm-Workspaces vollständig (lokale
   `workspace:`-Auflösung über `file:`-Symlinks im Root-`node_modules`),
   ohne dass pnpms zusätzliche Vorteile (Platzersparnis durch
   Content-addressable Store, striktere Dependency-Isolation) für die
   aktuelle Projektgröße (drei Apps, ein Repository, kein CI-Cache-
   Engpass bekannt) einen messbaren Gegenwert liefern.

**Geprüfte, nicht gewählte Alternativen:**
- **pnpm-Workspaces**: Vorteile bei Installationsgeschwindigkeit und
  Plattenplatz sowie striktere (weniger fehleranfällige) Dependency-
  Auflösung wurden anerkannt, aber als nicht ausschlaggebend bewertet
  gegenüber dem zusätzlichen, dokumentierten Konfigurationsrisiko mit
  Metro/Expo (siehe Begründung 2) — insbesondere da `apps/mobile` noch
  nicht existiert und ein Erstsetup ohne bekannte pnpm-spezifische
  Stolpersteine bevorzugt wird.
- **Yarn-Workspaces (classic oder Berry/PnP)**: Yarn classic wäre
  funktional ähnlich unauffällig wie npm bezüglich Hoisting, bringt aber
  einen zusätzlichen Paketmanager ins Projekt, ohne dass ein
  spezifischer Vorteil gegenüber dem bereits vorhandenen npm erkennbar
  ist. Yarn Berry/PnP wird zusätzlich explizit abgelehnt, da PnP
  (Plug'n'Play, kein `node_modules`) mit Metro/React-Native-Tooling
  historisch noch reibungsbehafteter ist als pnpms symlink-Modell und
  in der Expo-Dokumentation nicht als unterstützter Standardweg
  geführt wird.

### 2. Task-Orchestrierung/Caching: kein Turborepo, kein Nx (vorerst)
**Turborepo und Nx werden zum jetzigen Zeitpunkt nicht eingeführt.** Die
drei Apps werden vorerst ausschließlich über npm-Workspace-Skripte
(`npm run <script> --workspace=<app>` bzw. root-seitige Skripte, sobald
`package.json`-Dateien angelegt werden) verwaltet, ohne einen
zusätzlichen Task-Graph-/Caching-Layer.

Begründung:

1. **Kein aktueller Leidensdruck.** Turborepo/Nx lösen vor allem zwei
   Probleme: (a) wiederholte, unnötige Ausführung unveränderter Tasks
   (Caching) und (b) gezielte Ausführung nur betroffener Pakete
   ("affected"-Logik) in großen Monorepos mit vielen Paketen. Mit
   aktuell drei Apps und **keinem** existierenden Build-/Test-Setup gibt
   es keinen gemessenen oder auch nur plausibel zu erwartenden
   Engpass, den ein solcher Layer heute lösen würde.
2. **ADR 0006 deckt den Path-Filtering-Bedarf bereits ab.**
   GitHub-Actions-natives Path-Filtering und Matrix-Builds
   (ADR 0006, Abschnitt 2) leisten für den aktuellen Bedarf ("nur den
   `apps/mobile`-Job bei Änderungen unter `apps/mobile/**` ausführen")
   dasselbe wie die Affected-Detection von Turborepo/Nx — ohne
   zusätzliches Tool. Ein Task-Graph-Tool würde hier Funktionalität
   duplizieren, die bereits auf CI-Ebene entschieden ist.
3. **Zusätzliche Lernkurve ohne aktuellen Gegenwert.** Nx bringt ein
   eigenes Plugin-/Generator-Ökosystem und eigene Konventionen
   (`project.json`/`nx.json`, Executors) mit, Turborepo ein eigenes
   Pipeline-Konfigurationsformat (`turbo.json`) samt (bei Bedarf)
   Remote-Caching-Infrastruktur (z. B. Vercel Remote Cache oder
   selbstgehostet). Beides ist zusätzlicher konzeptioneller Aufbau, den
   ein einzelner Entwickler plus Agenten-Team sich aneignen und pflegen
   müsste (vgl. ADR 0003, Kriterium 3/4; ADR 0006, Begründung 4 zu
   selbstgehosteter Infrastruktur), ohne dass die drei aktuellen Apps
   die Investition rechtfertigen.
4. **Nicht endgültig, sondern eine Startpunkt-Entscheidung.** npm-
   Workspaces sind mit Turborepo (und mit Einschränkungen auch mit Nx)
   kompatibel und können **später ergänzt**, nicht ersetzt werden, falls
   reale Build-/Testzeit-Engpässe über die drei Apps hinweg auftreten
   (z. B. wiederholte, langsame `apps/web`-Builds in jedem CI-Lauf trotz
   unveränderter Quellen). Der Umstieg auf npm-Workspaces jetzt
   verbaut diesen Weg nicht, sondern ist eine Voraussetzung dafür
   (Turborepo/Nx setzen ohnehin auf einem Workspace-Mechanismus wie
   npm-Workspaces auf, ersetzen ihn nicht).

**Geprüfte, nicht gewählte Alternative:** Sofortige Einführung von
Turborepo als "günstige Vorabinvestition", da es laut eigener
Dokumentation inkrementell und ohne große Umstellung einführbar ist.
Abgelehnt für den jetzigen Zeitpunkt: Ohne existierendes
Build-/Test-Setup gibt es keine Task-Definitionen, deren Caching
konfiguriert werden könnte — die ADR würde damit Konfigurationsdetails
(`turbo.json`-Pipeline-Definitionen) vorwegnehmen, die von noch nicht
getroffenen Entscheidungen abhängen (z. B. `apps/web`-Build-Tool,
NestJS-Build-Konfiguration). Das widerspräche dem Grundsatz, keine
Werkzeugentscheidung zu treffen, die die aktuelle Story nicht zwingend
benötigt.

## Konsequenzen
- Sobald `package.json`-Dateien für `apps/web`, `apps/mobile`,
  `apps/api` und eine Root-`package.json` angelegt werden (künftige
  Developer-Aufgabe, nicht Teil dieser ADR), wird die Root-`package.json`
  ein `"workspaces"`-Feld mit den drei App-Pfaden (und optional einem
  künftigen `packages/`-Verzeichnis für geteilte Contract-Typen, siehe
  ADR 0003) enthalten. **Kein** `turbo.json`, **kein** `nx.json` und
  **kein** `pnpm-workspace.yaml` werden durch diese ADR angelegt oder
  vorweggenommen.
- Ein künftiges geteiltes Contract-Package (ADR 0003, Konsequenzen) wird
  als weiteres npm-Workspace-Paket eingebunden, sobald es extrahiert
  wird — diese ADR trifft dafür keine zusätzliche Struktur-Vorgabe
  über "es ist ein Workspace-Mitglied" hinaus.
- Die GitHub-Actions-Pipeline aus ADR 0006 nutzt für App-spezifische
  Jobs `npm ci`/`npm run <script> --workspace=<app>`-artige Aufrufe
  (konkrete Workflow-Syntax bleibt, wie in ADR 0006 festgehalten,
  Umsetzungsdetail außerhalb dieser ADR).
- **Risiko, explizit benannt statt verschwiegen:** Ohne Turborepo/Nx
  gibt es vorerst kein automatisches Caching von Lint-/Test-/Build-
  Ergebnissen zwischen CI-Läufen über npm-Skripte hinaus (npms
  eigener Cache betrifft nur den Dependency-Download, nicht
  Task-Ergebnisse). Wächst die Anzahl der Apps/Pakete oder wird
  CI-Laufzeit zu einem echten Engpass, ist das ein legitimer Anlass für
  eine Folge-ADR, die Turborepo oder Nx **ergänzend** zu den hier
  gewählten npm-Workspaces einführt — nicht für ein stillschweigendes
  Einführen ohne Dokumentation.
- **Risiko, explizit benannt:** Sollte sich `apps/mobile` später doch
  für pnpm eignen wollen (z. B. wegen Plattenplatz auf CI-Runnern bei
  wachsender Abhängigkeitszahl), wäre das ein Wechsel des
  Paketmanagers für das gesamte Monorepo (npm-Workspaces und
  pnpm-Workspaces lassen sich nicht ohne Migration mischen) — ebenfalls
  Gegenstand einer Folge-ADR, kein stillschweigender Parallelbetrieb
  zweier Lockfile-Formate.
- Kein `package.json`, kein Lockfile und keine Konfigurationsdatei
  werden durch diese ADR angelegt — analog zum Vorgehen bei
  ADR 0003/0005/0006 wird ausschließlich die Entscheidung dokumentiert,
  nicht implementiert.

## Datenklassifizierung
Diese ADR ist rein werkzeugbezogen (Paketmanager/Task-Orchestrierung) und
führt keine neue Datenverarbeitung oder neue Entitäten ein. Kein direkter
Bezug zu DSGVO-relevanten Entitäten aus `docs/domain-glossar.md`. Mittelbar
relevant bleibt der bereits in ADR 0005/ADR 0006 festgehaltene Grundsatz:
sobald mit dieser Tooling-Basis tatsächliche Build-/Test-Artefakte oder
CI-Caches entstehen, dürfen diese laut `CLAUDE.md` ("Sensible Daten") keine
echten Daten der DSGVO-relevanten Entitäten enthalten — insbesondere
**Lieferant** (`Supplier`), **Kontrakt** (`Contract`), **Steuerbescheid**
(`TaxCertificate`), **Prämie** (`Bonus`/`Premium`) und **Gutschrift**
(`CreditNote`). Diese ADR selbst klassifiziert keine neue Entität.
