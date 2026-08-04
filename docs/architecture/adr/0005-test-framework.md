# 0005. Jest als einheitliches Test-Framework für Web, Mobile und API

## Status
Vorgeschlagen

## Kontext
`docs/architecture/overview.md` listet unter "Offene technische
Entscheidungen" bislang "Test-Framework(s) für Web/Mobile/API" als
vollständig offen. Es existiert weiterhin kein `package.json` und kein
lauffähiges Setup in `apps/web`, `apps/mobile` oder `apps/api` (siehe
[ADR 0003](0003-monorepo-vs-polyrepo.md), die die Monorepo-Struktur
entscheidet, aber Tooling/Test/CI explizit offen lässt).

Die Frage wird jetzt entscheidungsreif, weil DevOps in
`docs/devops/lieferant-kontrakte-einsehen.md` bereits eine konkrete
CI-Pipeline mit mehreren Teststufen vorschlägt, ohne dass ein Test-Runner
feststeht:

- Lint & Type-Check
- Unit-Tests `apps/api` (u. a. 403/404/200-Fallunterscheidung,
  supplier-gefiltertes Repository-Verhalten, `isStale`-Berechnung)
- ein **Integrations-/E2E-Test gegen den echten HTTP-Layer von `apps/api`**
  ("Lieferant A ruft Kontrakt von Lieferant B ab → 403"), von Security als
  **Freigabevoraussetzung/Pipeline-Gate** eingestuft
- ein späterer Contract-/Schema-Test für den Lobster-Ingestion-Adapter

Relevante Rahmenbedingungen aus dem bestehenden Tech-Stack (`CLAUDE.md`):
durchgängig TypeScript; `apps/web` React, `apps/mobile` React Native/Expo,
`apps/api` NestJS.

Relevante Eigenschaften der beiden naheliegenden Kandidaten, bezogen auf
diese drei Apps:

- **Jest** ist der von Expo/React Native offiziell unterstützte und
  dokumentierte Test-Runner (`jest-expo`-Preset). React-Native-Module-Mocking,
  native Modul-Stubs und der Metro-Bundler-Kontext sind auf Jest
  zugeschnitten; ein alternativer Runner für `apps/mobile` wäre ein
  Sonderweg ohne offizielle Unterstützung. Jest ist zugleich der von NestJS
  in der offiziellen Dokumentation und im Standard-Scaffold verwendete
  Test-Runner (`@nestjs/testing` ist runner-agnostisch nutzbar, wird aber
  standardmäßig mit Jest dokumentiert und mit `supertest` für HTTP-Layer-
  Tests kombiniert — passend zum von DevOps geforderten
  Mandantentrennungs-Test gegen den echten HTTP-Layer). Für React
  (`apps/web`) ist Jest in Kombination mit `@testing-library/react`
  ebenfalls ein etablierter, vollständig unterstützter Weg.
- **Vitest** bietet für `apps/web` und potenziell `apps/api` Vorteile bei
  Ausführungsgeschwindigkeit und nativer ESM/TS-Unterstützung ohne
  `ts-jest`-Transpilationsschritt. Für `apps/mobile` (React Native/Expo)
  gibt es jedoch keine offiziell unterstützte, ausgereifte Integration —
  Metro-Bundler-Semantik, Haste-Modulauflösung und native Mocks sind auf
  Jest ausgelegt; eine Vitest-Nutzung für React Native wäre experimentell
  und nicht durch Expo-Dokumentation gedeckt.

## Entscheidung
**Jest** wird als einheitliches Test-Framework für `apps/api`, `apps/web`
und `apps/mobile` festgelegt — ein Runner für alle drei Apps, nicht drei
getrennte.

Begründung:

1. **`apps/mobile` erzwingt de facto Jest.** Da Expo/React Native keinen
   offiziell unterstützten Vitest-Weg bietet, wäre eine von Jest
   abweichende Wahl für `apps/mobile` ein unbegründetes technisches Risiko
   ohne Not.
2. **Monorepo-Konsistenz statt Tool-Wildwuchs.** ADR 0003 begründet die
   Monorepo-Entscheidung u. a. mit reduziertem CI-/Tooling-Overhead ("eine
   Pipeline statt N getrennte Stellen für Test-Konfiguration"). Ein
   einheitlicher Runner für alle drei Apps bedeutet: eine gemeinsame
   Mocking-API (`jest.mock` statt zusätzlich `vi.mock` mit abweichender
   Hoisting-/Modul-Semantik), ein Snapshot-Format, eine
   Coverage-Reporting-Pipeline und ein Wissensstand, den sowohl der
   menschliche Entwickler als auch die Developer-/QA-Agenten über alle
   Apps hinweg konsistent anwenden können. Das ist bei einem Ein-Personen-
   plus-Agenten-Team (siehe ADR 0003, Kriterium 3) besonders wertvoll: kein
   Kontextwechsel zwischen zwei Test-APIs je nachdem, welche App gerade
   bearbeitet wird.
3. **Jest ist für `apps/api` (NestJS) und `apps/web` (React) ausreichend
   und ausgereift**, auch wenn Vitest für diese beiden Apps isoliert
   betrachtet einen Geschwindigkeits-/DX-Vorteil hätte. Dieser isolierte
   Vorteil wird hier als nicht ausschlaggebend bewertet, weil er nur zwei
   von drei Apps beträfe und der Konsistenzverlust (Kriterium 2) höher
   gewichtet wird als der Geschwindigkeitsgewinn für zwei Apps. Diese
   Abwägung ist die in der Aufgabenstellung geforderte explizite
   Begründung für **eine** Wahl statt unterschiedlicher Frameworks pro App.
4. **`supertest` + Jest deckt den von DevOps geforderten
   HTTP-Layer-Integrationstest ab.** Der als Merge-Gate vorgeschlagene
   Mandantentrennungstest ("Lieferant A → Kontrakt von Lieferant B → 403")
   ist ein Standardmuster in NestJS-Jest-Setups (`supertest` gegen eine per
   `Test.createTestingModule(...).compile()` aufgebaute Testapplikation)
   und erfordert kein zusätzliches E2E-Framework (z. B. Playwright/Cypress)
   — er testet die HTTP-Schicht von `apps/api` direkt, keinen vollen
   Browser-Flow.

### Abgrenzung des Scopes dieser ADR
- Diese ADR entscheidet den **Unit- und HTTP-Layer-Integrationstest**-
  Runner für alle drei Apps (inkl. des von DevOps geforderten
  Mandantentrennungs-Gates in `apps/api`).
- **Nicht** Gegenstand dieser ADR: ein browserbasiertes End-to-End-
  Test-Framework für `apps/web` (z. B. Playwright/Cypress für volle
  User-Flows über UI + `apps/api` hinweg). Keine aktuelle Story verlangt
  das; wird bei Bedarf in einer eigenen ADR entschieden.
- **Nicht** Gegenstand: konkrete Coverage-Schwellen, konkrete
  `jest.config.*`-Dateien, Transpiler-Wahl (`ts-jest` vs. `@swc/jest` vs.
  Babel) für `apps/api`/`apps/web` sowie die genaue Jest-Preset-Version für
  `apps/mobile` (`jest-expo`). Das sind Umsetzungsdetails für den
  Developer-Agenten, sobald ein Paketmanager/Dependency-Setup existiert
  (siehe ADR 0003, weiterhin offen).
- **Nicht** Gegenstand: ob/wie ERP-/Lobster-seitige Contract-/Schema-Tests
  für den Ingestion-Adapter (siehe DevOps-Vorschlag, Punkt 7) aufgebaut
  werden — nur, dass sie, sobald relevant, ebenfalls mit Jest umsetzbar
  sind, da Jest kein Argument gegen diesen Test-Typ liefert.

## Konsequenzen
- Alle drei Apps verwenden dieselbe Test-API (`describe`/`it`/`expect`,
  `jest.mock`, Snapshot-Testing), was Cross-App-Reviews (siehe ADR 0003,
  Kriterium 2 "atomare Cross-App-Änderungen") erleichtert, da QA/Developer
  keine zwei Mocking-Semantiken gleichzeitig im Kopf behalten müssen.
- `apps/mobile` nutzt das `jest-expo`-Preset, sobald ein Expo-Projekt
  existiert — das ist zum jetzigen Zeitpunkt noch nicht eingerichtet.
- Für `apps/api` wird der von NestJS dokumentierte Doppel-Einsatz von Jest
  (Unit-Tests) und `supertest` (HTTP-Layer-Integrationstests, insbesondere
  der Mandantentrennungs-Gate-Test aus dem DevOps-Vorschlag) als
  naheliegender Weg vorgemerkt, aber nicht in dieser ADR final
  spezifiziert (Version, exakte Testapplikations-Bootstrapping-Details
  bleiben Umsetzungsdetail).
- **Risiko, explizit benannt statt verschwiegen:** Vitest hätte für
  `apps/web` und `apps/api` isoliert betrachtet Vorteile (Ausführungszeit,
  keine `ts-jest`-Transpilation). Durch die Wahl von Jest für alle drei
  Apps wird dieser potenzielle Vorteil zugunsten von
  Monorepo-Konsistenz bewusst nicht realisiert. Sollte sich
  Testausführungszeit in `apps/api`/`apps/web` künftig als echter
  Engpass erweisen, ist das ein legitimer Anlass für eine Folge-ADR, die
  diese Entscheidung revidiert — nicht für ein stillschweigendes
  Abweichen einzelner Apps.
- Kein CI-Workflow und kein Test-Setup-Code werden durch diese ADR
  angelegt (siehe [ADR 0006](0006-github-actions-als-ci-provider.md) für
  die getrennte CI-Provider-Entscheidung, die auf dieser Framework-Wahl
  aufbaut).

## Datenklassifizierung
Diese ADR selbst führt keine neue Datenverarbeitung ein, sondern legt ein
Werkzeug fest. Relevant ist sie jedoch als Rahmen für künftige Tests, die
zwangsläufig mit Fixture-Daten der folgenden laut Domain-Glossar
DSGVO-relevanten Entitäten arbeiten werden:

- **Lieferant** (`Supplier`): Ja, Stammdaten-sensibel — wird in
  Mandantentrennungstests (z. B. "Lieferant A vs. Lieferant B") zwingend
  als Fixture benötigt.
- **Kontrakt** (`Contract`): Ja, kommerziell sensibel — Gegenstand der von
  DevOps vorgeschlagenen Unit- und Integrationstests.
- **Steuerbescheid** (`TaxCertificate`), **Prämie** (`Bonus`/`Premium`),
  **Gutschrift** (`CreditNote`): Ja, hochsensibel/finanziell — noch nicht
  Gegenstand aktueller Tests, aber bei künftigen Belege-Storys ebenfalls
  über denselben Jest-Runner zu testen.

Wie in `CLAUDE.md` ("Sensible Daten") festgelegt, gilt unverändert: in
keiner Testsuite, keinem Fixture und keinem Snapshot dürfen echte
Lieferantendaten verwendet werden — ausschließlich klar erkennbare,
synthetische Testdaten. Diese ADR ändert daran nichts, weist aber
Developer/QA erneut darauf hin, da mit einer konkreten Test-Framework-Wahl
die erste tatsächliche Testsuite entstehen kann.
