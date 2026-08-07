/**
 * Generische, wiederverwendbare Tabellen-Komponente (ADR 0009 Abschnitt 4).
 * Nicht Lieferberechtigungs-spezifisch -- für Kontrakte/Abnahmescheine
 * ebenfalls nutzbar.
 *
 * WICHTIG (Architektur-Regel, ADR 0009 Abschnitt 4): `DataTable` verwaltet
 * die Auswahl NICHT selbst (fully controlled component) -- die aufrufende
 * Seite hält `selectedIds` im eigenen State. Das löst AC5/AC9: Bei einer
 * Zeitraum-Filter-Änderung setzt die Seite `selectedIds` aktiv zurück
 * (AC5), bei allen anderen Interaktionen bleibt der State unverändert
 * erhalten (AC9). "Alle markieren" (AC8) bezieht sich ausschließlich auf
 * die aktuell sichtbaren `rows`.
 *
 * Responsives Verhalten (AC2): die `<table>` liegt in einem horizontal
 * scrollbaren Container (`overflow-x: auto`, siehe `DataTable.module.css`)
 * statt Spalten auf schmalen Viewports auszublenden.
 */
import type { ReactNode } from 'react';

import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  render: (row: T) => ReactNode;
}

export interface DataTableSelectionProps {
  selectedIds: ReadonlySet<string>;
  onChange: (selectedIds: ReadonlySet<string>) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  emptyState?: ReactNode;
  selection?: DataTableSelectionProps;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, rows, getRowId, isLoading, error, emptyState, selection, rowActions } = props;

  if (isLoading) {
    // AC15: klar erkennbarer Ladezustand statt leerem/eingefrorenem Bildschirm.
    return (
      <p role="status" className={styles.status}>
        Lieferberechtigungen werden geladen…
      </p>
    );
  }

  if (error) {
    // AC17: verständliche Fehlermeldung statt stillschweigend leerer/falscher Liste.
    return (
      <p role="alert" className={styles.status}>
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    // AC16: benutzerfreundlicher Leer-Zustand statt leerer Tabelle ohne Erklärung.
    return <div className={styles.status}>{emptyState ?? 'Keine Einträge vorhanden.'}</div>;
  }

  const visibleIds = rows.map(getRowId);
  const allVisibleSelected =
    Boolean(selection) && visibleIds.length > 0 && visibleIds.every((id) => selection!.selectedIds.has(id));

  function toggleAll() {
    if (!selection) {
      return;
    }
    const next = new Set(selection.selectedIds);
    if (allVisibleSelected) {
      // AC8: erneutes Deaktivieren hebt die Auswahl aller (sichtbaren) Zeilen wieder auf.
      for (const id of visibleIds) {
        next.delete(id);
      }
    } else {
      // AC8: "Alle markieren" bezieht sich ausschließlich auf sichtbare Zeilen.
      for (const id of visibleIds) {
        next.add(id);
      }
    }
    selection.onChange(next);
  }

  function toggleRow(id: string) {
    if (!selection) {
      return;
    }
    const next = new Set(selection.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selection.onChange(next);
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selection ? (
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  aria-label="Alle markieren"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                />
              </th>
            ) : null}
            {columns.map((column) => (
              <th key={column.id}>{column.header}</th>
            ))}
            {rowActions ? <th aria-label="Aktionen" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row);
            return (
              <tr key={id}>
                {selection ? (
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label={`Zeile ${id} auswählen`}
                      checked={selection.selectedIds.has(id)}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.id}>{column.render(row)}</td>
                ))}
                {rowActions ? <td>{rowActions(row)}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
