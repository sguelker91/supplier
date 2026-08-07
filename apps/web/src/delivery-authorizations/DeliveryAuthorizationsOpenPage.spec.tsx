/**
 * Test für die Sammel-Öffnen-Ansicht (AC11): mehrere ausgewählte
 * Lieferberechtigungen werden nacheinander/untereinander dargestellt.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { DeliveryAuthorizationsOpenPage } from './DeliveryAuthorizationsOpenPage';

jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'synthetic-access-token' } }),
}));

jest.mock('./DeliveryAuthorizationDetailPage', () => ({
  DeliveryAuthorizationDetailPage: (props: { deliveryAuthorizationId?: string }) => (
    <p>Detail für {props.deliveryAuthorizationId}</p>
  ),
}));

function renderPage(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/delivery-authorizations/open${search}`]}>
      <Routes>
        <Route path="/delivery-authorizations/open" element={<DeliveryAuthorizationsOpenPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DeliveryAuthorizationsOpenPage', () => {
  it('zeigt die Detailinformationen aller ausgewählten IDs (AC11)', () => {
    renderPage('?ids=delivery-authorization-synthetic-1,delivery-authorization-synthetic-2');

    expect(screen.getByText('Detail für delivery-authorization-synthetic-1')).toBeInTheDocument();
    expect(screen.getByText('Detail für delivery-authorization-synthetic-2')).toBeInTheDocument();
  });

  it('zeigt einen Hinweis, wenn keine IDs übergeben wurden', () => {
    renderPage('');

    expect(screen.getByText('Keine Lieferberechtigungen ausgewählt.')).toBeInTheDocument();
  });
});
