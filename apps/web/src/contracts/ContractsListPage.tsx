/**
 * Zeigt, wie `apps/web` die Kontrakt-Liste laut ADR 0001 (Datenkontrakt
 * inkl. Sync-Metadaten) und den Akzeptanzkriterien AC1/AC2/AC5/AC6/AC8
 * rendert. Jetzt eine echte, renderbare React-Komponente (React + Vite,
 * siehe `vite.config.ts`), seit der Konsistenz-Review
 * (`docs/design/web-app-konsistenz-review.md`) auf dem seit ADR 0009
 * bestehenden Design-System (`DataTable`) statt einer rohen `<table>`.
 * Seit der "Modern Minimal"-Überarbeitung (Design-Canvas "Extranet Modern
 * Minimal") ohne den `Card`-Rahmen -- die Sidebar/Content-Aufteilung in
 * `AppShell` übernimmt die visuelle Abgrenzung, die Seite rendert Titel
 * und Tabelle direkt auf dem Content-Hintergrund.
 *
 * Bewusst weiterhin nicht Teil dieser Komponente (siehe Implementierungs-
 * notizen in docs/backlog/lieferant-kontrakte-einsehen.md):
 * - Kein Routing/Menüpunkt "Kontrakte" (AC1) -- reine Präsentationskomponente,
 *   die ihre Daten als Prop erhält.
 * - Kein echter HTTP-Client-Aufruf gegen `GET /contracts` -- das Laden der
 *   Daten (inkl. AC7-Redirect bei fehlender/abgelaufener Session) hängt am
 *   noch offenen OIDC-Login-Flow (ADR 0004, `auth-client.ts` bleibt TODO).
 * - Keine Detailansicht (AC3) und keine 403-Fehlerbehandlung bei direkter
 *   URL-Manipulation (AC4) -- das ist serverseitig bereits umgesetzt
 *   (`apps/api/src/contracts/contracts.controller.ts`) und müsste hier nur
 *   konsumiert werden, sobald Routing/Daten-Fetching entschieden ist.
 *
 * Story: docs/backlog/lieferant-kontrakte-einsehen.md
 */
import type { ContractListItem, ContractListResponse } from '../../../api/src/contracts/contract.types';
import type { DataTableColumn } from '../design-system/DataTable';
import { DataTable } from '../design-system/DataTable';
import styles from './ContractsListPage.module.css';

const COLUMNS: DataTableColumn<ContractListItem>[] = [
  { id: 'contractNumber', header: 'Kontraktnummer', render: (row) => row.contractNumber },
  { id: 'articleOrProductGroup', header: 'Artikel/Warengruppe', render: (row) => row.articleOrProductGroup },
  {
    id: 'agreedQuantity',
    header: 'Menge',
    render: (row) => `${row.agreedQuantity.value} ${row.agreedQuantity.unit}`,
  },
  { id: 'validFrom', header: 'Gültig von', render: (row) => row.validFrom },
  { id: 'validTo', header: 'Gültig bis', render: (row) => row.validTo },
  { id: 'status', header: 'Status', render: (row) => <ContractStatusBadge status={row.status} /> },
];

/**
 * Listenansicht. Zeigt die laut ADR 0001/AC2 mindestens erforderlichen
 * Spalten sowie die AC5- (Leer-Zustand) und AC6/AC8- (Sync-Hinweis,
 * "abgelaufen") Anforderungen.
 */
export function ContractsListPage(props: { data: ContractListResponse }) {
  const { contracts, lastSuccessfulSyncAt, isStale } = props.data;

  return (
    <div>
      <h1 className={styles.heading}>Kontrakte</h1>
      <p className={styles.description}>Ihre laufenden und abgelaufenen Liefervereinbarungen im Überblick.</p>

      {/* AC6: Hinweis auf Datenstand, insbesondere wenn veraltet. */}
      <p role="status" className={styles.syncStatus}>
        {lastSuccessfulSyncAt
          ? `Letzte erfolgreiche Aktualisierung: ${lastSuccessfulSyncAt}`
          : 'Noch keine erfolgreiche Datenaktualisierung vorhanden.'}
        {isStale ? <span className={styles.syncStatusStale}> (Achtung: Daten möglicherweise veraltet)</span> : null}
      </p>

      {/* AC5: klarer Leer-Zustand statt leerem Bildschirm, via DataTable. */}
      <DataTable
        columns={COLUMNS}
        rows={contracts}
        getRowId={(row) => row.id}
        emptyState="Keine Kontrakte vorhanden."
      />
    </div>
  );
}

function ContractStatusBadge(props: { status: ContractListItem['status'] }) {
  const isExpired = props.status === 'expired';

  // AC8: abgelaufene Kontrakte müssen eindeutig erkennbar sein -- Text bleibt
  // immer sichtbar (nicht nur farbkodiert; der Punkt allein wäre reine
  // Farbkodierung), siehe Konsistenz-Review.
  return (
    <span className={styles.statusCell}>
      <span className={isExpired ? styles.statusDotExpired : styles.statusDotActive} />
      <span className={isExpired ? styles.statusTextExpired : undefined}>
        {isExpired ? 'abgelaufen' : 'aktiv'}
      </span>
    </span>
  );
}
