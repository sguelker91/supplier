/**
 * Listenansicht der Lieferberechtigungen (AC1-AC12, AC15-AC17), zeigt, wie
 * `apps/web` `Card`/`DateRangeFilter`/`DataTable` (ADR 0009 Abschnitt 1/4/5)
 * für die neue Domäne einsetzt.
 *
 * Architektur-Entscheidungen (ADR 0009):
 * - Auswahl-State lebt in dieser Seite, NICHT in `DataTable` (Abschnitt 4).
 * - Standardzeitraum wird HIER berechnet (Abschnitt 6), `apps/api` verlangt
 *   `from`/`to` immer explizit.
 * - "Öffnen" (einzeln/gesammelt) navigiert clientseitig (Abschnitt 7),
 *   kein Modal/Download.
 */
import { useEffect, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';

import type { DeliveryAuthorization, DeliveryAuthorizationListResponse } from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import { Card } from '../design-system/Card';
import type { DataTableColumn } from '../design-system/DataTable';
import { DataTable } from '../design-system/DataTable';
import type { DateRangeValue } from '../design-system/DateRangeFilter';
import { DateRangeFilter } from '../design-system/DateRangeFilter';
import { fetchMyDeliveryAuthorizations } from './delivery-authorization-client';
import { getDefaultDeliveryAuthorizationDateRange } from './date-range-default';
import styles from './DeliveryAuthorizationsListPage.module.css';

export interface DeliveryAuthorizationsListPageProps {
  /**
   * Injizierbar für Tests. Ohne Angabe wird der echte HTTP-Client
   * (`delivery-authorization-client.ts`) mit dem aktuellen
   * OIDC-Access-Token verwendet (AC1: Daten stammen aus dem über
   * `apps/api` gekapselten Backend-Service).
   */
  fetchDeliveryAuthorizations?: (range: DateRangeValue) => Promise<DeliveryAuthorizationListResponse>;
}

const COLUMNS: DataTableColumn<DeliveryAuthorization>[] = [
  { id: 'callOffNumber', header: 'Abrufnummer', render: (row) => row.callOffNumber },
  { id: 'deliveryDate', header: 'Lieferdatum', render: (row) => row.deliveryDate },
  { id: 'deliveryTime', header: 'Uhrzeit', render: (row) => row.deliveryTime },
  { id: 'variety', header: 'Sorte', render: (row) => row.variety },
];

export function DeliveryAuthorizationsListPage(props: DeliveryAuthorizationsListPageProps) {
  const auth = useAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<DateRangeValue>(() => getDefaultDeliveryAuthorizationDateRange());
  const [items, setItems] = useState<DeliveryAuthorization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  const loadDeliveryAuthorizations =
    props.fetchDeliveryAuthorizations ??
    ((range: DateRangeValue) => fetchMyDeliveryAuthorizations(auth.user?.access_token, range));

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    loadDeliveryAuthorizations(dateRange)
      .then((response) => {
        if (cancelled) {
          return;
        }
        setItems(response.items);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }
        // AC17: verständliche Fehlermeldung statt stillschweigend leerer/falscher Liste.
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Lieferberechtigungen konnten nicht geladen werden.',
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `loadDeliveryAuthorizations` ist pro Render neu, absichtlich nicht in den Deps.
  }, [dateRange]);

  function handleDateRangeChange(next: DateRangeValue) {
    setDateRange(next);
    // AC5/AC9: eine Zeitraum-Filter-Änderung setzt eine bestehende Auswahl
    // aktiv zurück, statt sie auf nun evtl. nicht mehr angezeigten Zeilen
    // "unsichtbar" bestehen zu lassen.
    setSelectedIds(new Set());
  }

  function handleOpenSingle(id: string) {
    // AC10: "Öffnen" navigiert zur Detailansicht dieser einen Lieferberechtigung.
    navigate(`/delivery-authorizations/${encodeURIComponent(id)}`);
  }

  function handleOpenSelected() {
    // AC11/AC12: nur mit Auswahl auslösbar, bezieht ausschließlich markierte Zeilen ein.
    if (selectedIds.size === 0) {
      return;
    }
    const ids = Array.from(selectedIds).join(',');
    navigate(`/delivery-authorizations/open?ids=${encodeURIComponent(ids)}`);
  }

  return (
    <Card title="Lieferberechtigungen">
      <div className={styles.filterRow}>
        <DateRangeFilter
          value={dateRange}
          onChange={handleDateRangeChange}
          fromLabel="Lieferdatum von"
          toLabel="Lieferdatum bis"
        />
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.bulkOpenButton}
          disabled={selectedIds.size === 0}
          onClick={handleOpenSelected}
        >
          Ausgewählte öffnen ({selectedIds.size})
        </button>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={items}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        error={error}
        emptyState="Keine Lieferberechtigungen im gewählten Zeitraum."
        selection={{ selectedIds, onChange: setSelectedIds }}
        rowActions={(row) => (
          <button type="button" className={styles.rowOpenButton} onClick={() => handleOpenSingle(row.id)}>
            Öffnen
          </button>
        )}
      />
    </Card>
  );
}
