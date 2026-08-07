/**
 * Zeigt, wie `apps/web` die Kontrakt-Liste laut ADR 0001 (Datenkontrakt
 * inkl. Sync-Metadaten) und den Akzeptanzkriterien AC1/AC2/AC5/AC6/AC8
 * rendert. Jetzt eine echte, renderbare React-Komponente (React + Vite,
 * siehe `vite.config.ts`), seit der Konsistenz-Review
 * (`docs/design/web-app-konsistenz-review.md`) auf dem seit ADR 0009
 * bestehenden Design-System (`Card`/`DataTable`) statt einer rohen
 * `<table>`.
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
import { Card } from '../design-system/Card';
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
    <Card title="Kontrakte">
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
    </Card>
  );
}

function ContractStatusBadge(props: { status: ContractListItem['status'] }) {
  const isExpired = props.status === 'expired';

  // AC8: abgelaufene Kontrakte müssen eindeutig erkennbar sein -- Text bleibt
  // immer sichtbar (nicht nur farbkodiert), siehe Konsistenz-Review.
  return (
    <span className={`${styles.statusBadge} ${isExpired ? styles.statusBadgeExpired : styles.statusBadgeActive}`}>
      {isExpired ? 'abgelaufen' : 'aktiv'}
    </span>
  );
}
