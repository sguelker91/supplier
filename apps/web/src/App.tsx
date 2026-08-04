/**
 * App-Shell mit echtem OIDC-Login-Flow (ADR 0004/0008).
 *
 * - `<AuthProvider>` (react-oidc-context) umschließt die gesamte App und
 *   stellt den Auth-Kontext (`useAuth()`) für `LoginPage`, `LogoutButton`,
 *   `ProtectedArea` und `AuthCallbackPage` bereit.
 * - Die OIDC-`redirect_uri` (`AUTH_CALLBACK_PATH`, siehe
 *   `auth/zitadel-config.ts`) wird per einfachem Pfad-Vergleich erkannt
 *   (kein Routing-Paket entschieden, siehe `ProtectedArea.tsx` für die
 *   ausführliche Begründung dieser bewussten Minimal-Lösung) und rendert
 *   dann `AuthCallbackPage` statt der eigentlichen App.
 * - Außerhalb des Callback-Pfads schützt `ProtectedArea` den Zugriff auf
 *   `ContractsListPage` (AC7): nicht angemeldete Nutzer sehen die
 *   `LoginPage` statt der Kontrakte.
 *
 * `ContractsListPage` erhält weiterhin offensichtlich synthetische
 * Demo-Daten statt echter Daten aus `apps/api` -- ein echter Daten-Fetch
 * (inkl. Lade-/Fehlerzuständen, Cache) ist laut bestehender
 * Implementierungsnotiz in `docs/backlog/lieferant-kontrakte-einsehen.md`
 * bewusst nicht Teil dieses Bootstrap-Auftrags und bleibt es auch hier;
 * `auth/auth-client.ts::fetchMyContracts()` zeigt aber bereits, wie das
 * jetzt vorhandene Access-Token (`auth.user?.access_token`) dafür als
 * `Authorization: Bearer`-Header angehängt würde.
 */
import { AuthProvider } from 'react-oidc-context';

import { AuthCallbackPage } from './auth/AuthCallbackPage';
import { LogoutButton } from './auth/LogoutButton';
import { ProtectedArea } from './auth/ProtectedArea';
import { AUTH_CALLBACK_PATH, createZitadelAuthProviderProps } from './auth/zitadel-config';
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
  const isAuthCallback = window.location.pathname === AUTH_CALLBACK_PATH;

  return (
    <AuthProvider {...createZitadelAuthProviderProps()}>
      {isAuthCallback ? (
        <AuthCallbackPage />
      ) : (
        <ProtectedArea>
          <LogoutButton />
          <ContractsListPage data={DEMO_DATA} />
        </ProtectedArea>
      )}
    </AuthProvider>
  );
}
