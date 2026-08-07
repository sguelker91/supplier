/**
 * Rendering-Test für `ContractsListPage` (React Testing Library).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 */
import { render, screen } from '@testing-library/react';

import type { ContractListResponse } from '../../../api/src/contracts/contract.types';
import { ContractsListPage } from './ContractsListPage';

function buildResponse(overrides: Partial<ContractListResponse> = {}): ContractListResponse {
  return {
    contracts: [],
    lastSuccessfulSyncAt: null,
    isStale: false,
    ...overrides,
  };
}

describe('ContractsListPage', () => {
  it('zeigt den Leer-Zustand, wenn keine Kontrakte vorhanden sind (AC5)', () => {
    render(<ContractsListPage data={buildResponse()} />);

    expect(screen.getByText('Keine Kontrakte vorhanden.')).toBeInTheDocument();
  });

  it('rendert eine Zeile pro Kontrakt mit den Pflichtspalten (AC2)', () => {
    render(
      <ContractsListPage
        data={buildResponse({
          contracts: [
            {
              id: 'contract-synthetic-1',
              contractNumber: 'SYNTH-TEST-1',
              articleOrProductGroup: 'Testartikelgruppe',
              agreedQuantity: { value: 42, unit: 'kg' },
              validFrom: '2026-01-01',
              validTo: '2026-12-31',
              status: 'active',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('SYNTH-TEST-1')).toBeInTheDocument();
    expect(screen.getByText('Testartikelgruppe')).toBeInTheDocument();
    expect(screen.getByText('42 kg')).toBeInTheDocument();
    expect(screen.getByText('aktiv')).toBeInTheDocument();
  });

  it('kennzeichnet abgelaufene Kontrakte eindeutig (AC8)', () => {
    render(
      <ContractsListPage
        data={buildResponse({
          contracts: [
            {
              id: 'contract-synthetic-expired',
              contractNumber: 'SYNTH-TEST-EXPIRED',
              articleOrProductGroup: 'Testartikelgruppe',
              agreedQuantity: { value: 1, unit: 'Stk' },
              validFrom: '2024-01-01',
              validTo: '2024-12-31',
              status: 'expired',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('abgelaufen')).toBeInTheDocument();
    expect(screen.queryByText('aktiv')).not.toBeInTheDocument();
  });

  it('zeigt einen Veraltet-Hinweis, wenn isStale gesetzt ist (AC6)', () => {
    render(
      <ContractsListPage
        data={buildResponse({
          lastSuccessfulSyncAt: '2026-08-01T00:00:00Z',
          isStale: true,
        })}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Achtung: Daten möglicherweise veraltet');
  });
});
