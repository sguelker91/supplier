/**
 * Rendering-/Interaktions-Test für `DataTable` (AC7/AC8/AC9/AC15/AC16/AC17).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import type { DataTableColumn } from './DataTable';
import { DataTable } from './DataTable';

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: 'row-1', name: 'Synthetische Zeile 1' },
  { id: 'row-2', name: 'Synthetische Zeile 2' },
];

const COLUMNS: DataTableColumn<Row>[] = [{ id: 'name', header: 'Name', render: (row) => row.name }];

describe('DataTable', () => {
  it('zeigt einen Ladezustand (AC15)', () => {
    render(<DataTable columns={COLUMNS} rows={[]} getRowId={(r) => r.id} isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('zeigt eine Fehlermeldung (AC17)', () => {
    render(
      <DataTable columns={COLUMNS} rows={[]} getRowId={(r) => r.id} error="Etwas ist schiefgelaufen." />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Etwas ist schiefgelaufen.');
  });

  it('zeigt einen Leer-Zustand statt einer leeren Tabelle (AC16)', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={[]}
        getRowId={(r) => r.id}
        emptyState="Keine Lieferberechtigungen im gewählten Zeitraum."
      />,
    );
    expect(screen.getByText('Keine Lieferberechtigungen im gewählten Zeitraum.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('rendert eine Zeile pro Eintrag mit Checkbox und Öffnen-Aktion (AC7)', () => {
    render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(r) => r.id}
        selection={{ selectedIds: new Set(), onChange: jest.fn() }}
        rowActions={(row) => <button type="button">{`Öffnen ${row.id}`}</button>}
      />,
    );

    expect(screen.getByText('Synthetische Zeile 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Öffnen row-1' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' })).toBeInTheDocument();
  });

  function ControlledSelectionTable() {
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
    return (
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(r) => r.id}
        selection={{ selectedIds, onChange: setSelectedIds }}
      />
    );
  }

  it('markiert eine einzelne Zeile per Checkbox (AC7)', () => {
    render(<ControlledSelectionTable />);

    const checkbox = screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Zeile row-2 auswählen' })).not.toBeChecked();
  });

  it('"Alle markieren" markiert alle sichtbaren Zeilen, erneutes Klicken hebt die Auswahl wieder auf (AC8)', () => {
    render(<ControlledSelectionTable />);

    const selectAll = screen.getByRole('checkbox', { name: 'Alle markieren' });
    fireEvent.click(selectAll);

    expect(screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Zeile row-2 auswählen' })).toBeChecked();
    expect(selectAll).toBeChecked();

    fireEvent.click(selectAll);

    expect(screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Zeile row-2 auswählen' })).not.toBeChecked();
  });

  it('bleibt bei nicht auswahlbezogenen Re-Renders erhalten (AC9, hier: Prop-Update ohne Auswahländerung)', () => {
    const onChange = jest.fn();
    const selectedIds = new Set(['row-1']);

    const { rerender } = render(
      <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} selection={{ selectedIds, onChange }} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' })).toBeChecked();

    rerender(
      <DataTable columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} selection={{ selectedIds, onChange }} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Zeile row-1 auswählen' })).toBeChecked();
    expect(onChange).not.toHaveBeenCalled();
  });
});
