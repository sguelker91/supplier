/**
 * Minimale App-Shell. Rendert `ContractsListPage` vorerst mit
 * offensichtlich synthetischen Demo-Daten, da der echte Daten-Fetch
 * gegen `apps/api` einen laufenden OIDC-Login (ADR 0004) voraussetzt,
 * der laut ADR 0004 weiterhin bewusst als TODO markiert ist
 * (`src/auth/auth-client.ts`). Kein Routing/Menüpunkt (AC1) -- das ist
 * nicht Teil dieses Bootstrap-Auftrags.
 */
import { ContractsListPage } from './contracts/ContractsListPage';

const DEMO_DATA = {
  contracts: [
    {
      id: 'demo-contract-1',
      contractNumber: 'DEMO-KONTRAKT-1',
      articleOrProductGroup: 'Demo-Warengruppe',
      agreedQuantity: { value: 100, unit: 'kg' },
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      status: 'active' as const,
    },
  ],
  lastSuccessfulSyncAt: '2026-08-04T08:00:00Z',
  isStale: false,
};

export function App() {
  return <ContractsListPage data={DEMO_DATA} />;
}
