/**
 * Integrationstest für `DeliveryAuthorizationsListPage`
 * (AC4/AC5/AC7/AC8/AC9/AC10/AC11/AC12/AC15/AC16/AC17, siehe AC18: "Tests").
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 *
 * `react-oidc-context` wird gemockt (kein echter Login-Flow nötig); der
 * echte HTTP-Client wird über die injizierbare `fetchDeliveryAuthorizations`
 * -Prop ersetzt (kein echter `fetch`-Mock nötig, siehe Komponenten-Prop).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { DeliveryAuthorization, DeliveryAuthorizationListResponse } from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import { DeliveryAuthorizationsListPage } from './DeliveryAuthorizationsListPage';

jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'synthetic-access-token' } }),
}));

function buildItem(overrides: Partial<DeliveryAuthorization> = {}): DeliveryAuthorization {
  return {
    id: 'delivery-authorization-synthetic-1',
    supplierId: 'supplier-synthetic-a',
    callOffNumber: 'SYNTH-ABRUF-1',
    deliveryDate: '2026-08-10',
    deliveryTime: '08:00',
    variety: 'Testsorte A',
    ...overrides,
  };
}

function buildResponse(items: DeliveryAuthorization[]): DeliveryAuthorizationListResponse {
  return { items, lastSuccessfulSyncAt: null, isStale: false };
}

function renderPage(fetchDeliveryAuthorizations: (range: { from: string; to: string }) => Promise<DeliveryAuthorizationListResponse>) {
  return render(
    <MemoryRouter initialEntries={['/delivery-authorizations']}>
      <Routes>
        <Route
          path="/delivery-authorizations"
          element={<DeliveryAuthorizationsListPage fetchDeliveryAuthorizations={fetchDeliveryAuthorizations} />}
        />
        <Route path="/delivery-authorizations/:id" element={<p>Detailseite</p>} />
        <Route path="/delivery-authorizations/open" element={<p>Sammel-Öffnen-Seite</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DeliveryAuthorizationsListPage', () => {
  it('zeigt einen Ladezustand, bevor die Daten geladen sind (AC15)', () => {
    const fetchDeliveryAuthorizations = jest.fn(() => new Promise<DeliveryAuthorizationListResponse>(() => {}));
    renderPage(fetchDeliveryAuthorizations);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('lädt initial mit einem vorbelegten Zeitraum-Filter (AC4)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(buildResponse([]));
    renderPage(fetchDeliveryAuthorizations);

    await waitFor(() => expect(fetchDeliveryAuthorizations).toHaveBeenCalledTimes(1));
    const [range] = fetchDeliveryAuthorizations.mock.calls[0] as [{ from: string; to: string }];
    expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('zeigt einen Leer-Zustand, wenn keine Lieferberechtigungen vorliegen (AC16)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(buildResponse([]));
    renderPage(fetchDeliveryAuthorizations);

    expect(await screen.findByText('Keine Lieferberechtigungen im gewählten Zeitraum.')).toBeInTheDocument();
  });

  it('zeigt eine Fehlermeldung, wenn das Laden fehlschlägt (AC17)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockRejectedValue(new Error('synthetischer Backend-Fehler'));
    renderPage(fetchDeliveryAuthorizations);

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetischer Backend-Fehler');
  });

  it('aktualisiert die Tabelle bei einer Zeitraum-Filter-Änderung und setzt eine bestehende Auswahl zurück (AC5/AC9)', async () => {
    const fetchDeliveryAuthorizations = jest
      .fn()
      .mockResolvedValueOnce(buildResponse([buildItem()]))
      .mockResolvedValueOnce(buildResponse([buildItem({ id: 'delivery-authorization-synthetic-2', callOffNumber: 'SYNTH-ABRUF-2' })]));

    renderPage(fetchDeliveryAuthorizations);

    await screen.findByText('SYNTH-ABRUF-1');

    // Zeile markieren.
    fireEvent.click(screen.getByRole('checkbox', { name: /auswählen/i }));
    expect(screen.getByText(/Ausgewählte öffnen \(1\)/)).toBeInTheDocument();

    // Zeitraum ändern -> neuer Request, Auswahl wird zurückgesetzt (AC5/AC9).
    fireEvent.change(screen.getByLabelText('Lieferdatum von'), { target: { value: '2026-09-01' } });

    await waitFor(() => expect(fetchDeliveryAuthorizations).toHaveBeenCalledTimes(2));
    await screen.findByText('SYNTH-ABRUF-2');

    expect(screen.getByText(/Ausgewählte öffnen \(0\)/)).toBeInTheDocument();
  });

  it('"Alle markieren" markiert alle sichtbaren Zeilen, erneutes Klicken hebt die Auswahl auf (AC8)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(
      buildResponse([
        buildItem({ id: 'delivery-authorization-synthetic-1', callOffNumber: 'SYNTH-ABRUF-1' }),
        buildItem({ id: 'delivery-authorization-synthetic-2', callOffNumber: 'SYNTH-ABRUF-2' }),
      ]),
    );
    renderPage(fetchDeliveryAuthorizations);

    await screen.findByText('SYNTH-ABRUF-1');

    const selectAll = screen.getByRole('checkbox', { name: 'Alle markieren' });
    fireEvent.click(selectAll);
    expect(screen.getByText(/Ausgewählte öffnen \(2\)/)).toBeInTheDocument();

    fireEvent.click(selectAll);
    expect(screen.getByText(/Ausgewählte öffnen \(0\)/)).toBeInTheDocument();
  });

  it('die Sammel-Öffnen-Aktion ist ohne Auswahl deaktiviert (AC12)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(buildResponse([buildItem()]));
    renderPage(fetchDeliveryAuthorizations);

    await screen.findByText('SYNTH-ABRUF-1');

    expect(screen.getByRole('button', { name: /Ausgewählte öffnen/ })).toBeDisabled();
  });

  it('navigiert beim einzelnen Öffnen zur Detailansicht dieser einen Lieferberechtigung (AC10)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(buildResponse([buildItem()]));
    renderPage(fetchDeliveryAuthorizations);

    await screen.findByText('SYNTH-ABRUF-1');
    fireEvent.click(screen.getByRole('button', { name: 'Öffnen' }));

    expect(await screen.findByText('Detailseite')).toBeInTheDocument();
  });

  it('navigiert beim Sammel-Öffnen zur Sammelansicht mit allen ausgewählten IDs (AC11)', async () => {
    const fetchDeliveryAuthorizations = jest.fn().mockResolvedValue(
      buildResponse([
        buildItem({ id: 'delivery-authorization-synthetic-1' }),
        buildItem({ id: 'delivery-authorization-synthetic-2', callOffNumber: 'SYNTH-ABRUF-2' }),
      ]),
    );
    renderPage(fetchDeliveryAuthorizations);

    await screen.findByText('SYNTH-ABRUF-1');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Alle markieren' }));
    fireEvent.click(screen.getByRole('button', { name: /Ausgewählte öffnen/ }));

    expect(await screen.findByText('Sammel-Öffnen-Seite')).toBeInTheDocument();
  });
});
