/**
 * Rendering-Test für `DeliveryAuthorizationDetailPage` (AC10/AC13).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { DeliveryAuthorizationDetailResponse } from '../../../api/src/delivery-authorizations/delivery-authorization.types';
import type { DocumentReference } from '../../../api/src/documents/document.types';
import { DeliveryAuthorizationDetailPage } from './DeliveryAuthorizationDetailPage';

jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'synthetic-access-token' } }),
}));

const SYNTHETIC_DELIVERY_AUTHORIZATION: DeliveryAuthorizationDetailResponse = {
  id: 'delivery-authorization-synthetic-1',
  supplierId: 'supplier-synthetic-a',
  callOffNumber: 'SYNTH-ABRUF-1',
  deliveryDate: '2026-08-10',
  deliveryTime: '08:00',
  variety: 'Testsorte A',
  lastSuccessfulSyncAt: null,
  isStale: false,
};

function renderPage(overrides: {
  fetchDeliveryAuthorization?: (id: string) => Promise<DeliveryAuthorizationDetailResponse>;
  fetchDocuments?: (id: string) => Promise<DocumentReference[]>;
}) {
  return render(
    <MemoryRouter initialEntries={['/delivery-authorizations/delivery-authorization-synthetic-1']}>
      <Routes>
        <Route
          path="/delivery-authorizations/:id"
          element={
            <DeliveryAuthorizationDetailPage
              fetchDeliveryAuthorization={overrides.fetchDeliveryAuthorization ?? (() => Promise.resolve(SYNTHETIC_DELIVERY_AUTHORIZATION))}
              fetchDocuments={overrides.fetchDocuments ?? (() => Promise.resolve([]))}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DeliveryAuthorizationDetailPage', () => {
  it('zeigt einen Ladezustand, bevor die Lieferberechtigung geladen ist', () => {
    renderPage({ fetchDeliveryAuthorization: () => new Promise(() => {}) });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('zeigt die Kernfelder der Lieferberechtigung (AC10)', async () => {
    renderPage({});

    expect(await screen.findByRole('heading', { name: 'Lieferberechtigung SYNTH-ABRUF-1' })).toBeInTheDocument();
    expect(screen.getByText('2026-08-10')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('Testsorte A')).toBeInTheDocument();
  });

  it('zeigt eine Fehlermeldung, wenn das Laden der Kerndaten fehlschlägt', async () => {
    renderPage({
      fetchDeliveryAuthorization: () => Promise.reject(new Error('synthetischer Zugriffsfehler')),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetischer Zugriffsfehler');
  });

  it('zeigt die Kerndaten weiterhin an, wenn das (optionale) Dokumenten-Laden fehlschlägt (AC13)', async () => {
    renderPage({ fetchDocuments: () => Promise.reject(new Error('D3-Cloud nicht erreichbar (synthetisch)')) });

    expect(await screen.findByRole('heading', { name: 'Lieferberechtigung SYNTH-ABRUF-1' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('zeigt geladene Dokumente, wenn welche vorhanden sind (AC13)', async () => {
    renderPage({
      fetchDocuments: () => Promise.resolve([{ id: 'doc-synthetic-1', name: 'Synthetisches Testdokument' }]),
    });

    expect(await screen.findByText('Synthetisches Testdokument')).toBeInTheDocument();
  });
});
