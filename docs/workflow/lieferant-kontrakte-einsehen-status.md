# Pipeline-Status: Lieferant kann seine Kontrakte in der Extranet-Weboberfläche einsehen

Datum: 2026-08-04

## Schritte

| Schritt | Rolle | Output-Datei | Status |
|---|---|---|---|
| 1 | Product Owner | `docs/backlog/lieferant-kontrakte-einsehen.md` | OK |
| 2 | Architect | `docs/architecture/adr/0001-lobster-kontrakt-datenkontrakt-und-sync-status.md`, `docs/architecture/adr/0002-mandantentrennung-kontrakte.md` | OK |
| 3 | Developer | `apps/api/src/contracts/*.ts`, `apps/web/src/contracts/ContractsListPage.tsx`, Implementierungsnotiz im Backlog | OK (bewusster Konturwurf, nicht lauffähig) |
| 4 | QA | `docs/qa/lieferant-kontrakte-einsehen.md` | OK — Freigabe-Status: **Blockiert** |
| 5 | Security | `docs/security/lieferant-kontrakte-einsehen.md` (durch Orchestrator persistiert) | OK — Freigabe-Status: **Blockiert** |
| 6 | DevOps | `docs/devops/lieferant-kontrakte-einsehen.md` | OK |
| 7 | Documentation | `docs/product/lieferant-kontrakte-einsehen.md` | OK |

## Zusammenfassung

Die Pipeline lief vollständig und ohne technische Fehler durch: PO-Story, zwei ADRs, ein bewusst minimaler Code-Konturwurf, sowie QA-, Security-, DevOps- und Endnutzer-Dokumentation wurden erzeugt. Fachlich ist das Feature jedoch **nicht produktionsreif**: sowohl QA als auch Security haben unabhängig voneinander "Blockiert" befunden, weil zentrale Anforderungen (Mandantentrennung, Session-Schutz) im Code nur als Absicht skizziert, aber nicht durchsetzend implementiert sind — es fehlen Framework-Setup, Persistenz, Auth-Mechanismus und Tests. Die Pipeline hat damit genau das getan, was von ihr erwartet wird: ehrlich aufzeigen, dass eine Weiterentwicklung nötig ist, statt einen falschen "Fertig"-Eindruck zu erzeugen.

## Offene Risiken / Blocker

- **QA (Blockiert):** AC7 (Session-Schutz) nicht umgesetzt; zwei konkrete Bugs im Prototyp (`listMyContracts()` befüllt Sync-Status-Felder nicht; keine Ableitungslogik für `Contract.status` aus `validTo`, wodurch die Abgelaufen-Kennzeichnung nie greift).
- **Security (Blockiert, kritisch):** Mandantentrennung (AC4) und Session-Schutz (AC7) sind nicht end-to-end durchsetzbar (kein Controller/Guard/Auth-Middleware); `AuthenticatedSupplierContext` hat keine Herkunftsgarantie.
- **Security (hoch):** Ungeklärter 403-vs-404-Enumerations-Trade-off; fehlende Datenminimierungs-Allowlist für ERP-Felder an der Lobster-Grenze.
- **DSGVO:** Rechtsgrundlage, Aufbewahrungsfristen und Audit-Logging für Kontraktdaten sind nicht dokumentiert.

## Nächste Schritte

1. Architect/Team: Monorepo-Tooling, Test-Framework und Auth-Mechanismus final entscheiden (bislang offene Grundsatzfragen, siehe `docs/architecture/overview.md`).
2. Developer: Controller + Auth-Guard implementieren, der `AuthenticatedSupplierContext` verifiziert befüllt; die beiden von QA gefundenen Bugs beheben.
3. Architect/Security: Entscheidung zum 403/404-Trade-off (opake IDs + Rate-Limiting) sowie Feld-Allowlist für `conditions[]` festlegen.
4. PO/Security: DSGVO-Rechtsgrundlage und Aufbewahrungskonzept dokumentieren.
5. Erst danach erneuten QA-/Security-Durchlauf für diesen Slug anstoßen, um die Freigabe zu erreichen.
