/**
 * App-Shell mit echtem OIDC-Login-Flow (ADR 0004/0008) UND, seit ADR 0009
 * ("Lieferberechtigungen: Web-Design-System, Routing, Backend-Domäne und
 * Dokumenten-Service-Abstraktion"), echtem clientseitigem Routing über
 * `react-router-dom` statt eines manuellen `window.location.pathname`-
 * Vergleichs.
 *
 * Routen (ADR 0009 Abschnitt 2):
 * - `AUTH_CALLBACK_PATH`          -> `AuthCallbackPage`, jetzt eine reguläre
 *   Route statt eines manuellen Pfad-Vergleichs (ADR 0009 "Konsequenzen").
 * - `/`                           -> Redirect auf `/contracts`.
 * - `/contracts`                  -> `ContractsListPage` (in `AppShell`).
 * - `/delivery-authorizations`    -> `DeliveryAuthorizationsListPage` (in `AppShell`).
 * - `/delivery-authorizations/open` -> Sammel-Öffnen-Ansicht (Query `?ids=`).
 * - `/delivery-authorizations/:id`  -> Detailansicht.
 *
 * `ProtectedArea` (AC7 der Story `lieferanten-anmeldung-gpa`) gated seit
 * 2026-09-03 wieder den Zugriff auf `Portal()` -- siehe Kommentar dort zur
 * Historie (war vom 2026-08-07 bis 2026-09-03 temporär deaktiviert) und zum
 * Vorgehen, falls der reale Login erneut deaktiviert werden muss.
 * `AppShell` (ADR 0009 Abschnitt 1) stellt die gemeinsame
 * Navigationsstruktur zwischen Kontrakten und Lieferberechtigungen bereit
 * (AC3 der Story `lieferberechtigungen-anzeigen`).
 *
 * `ContractsListPage` erhält weiterhin offensichtlich synthetische
 * Demo-Daten statt echter Daten aus `apps/api` -- unverändert gegenüber
 * dem bisherigen Stand (siehe Implementierungsnotiz in
 * `docs/backlog/lieferant-kontrakte-einsehen.md`); nur
 * `DeliveryAuthorizationsListPage`/`DeliveryAuthorizationDetailPage` laden
 * jetzt echt von `apps/api`.
 */
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthCallbackPage } from './auth/AuthCallbackPage';
import { LogoutButton } from './auth/LogoutButton';
import { ProtectedArea } from './auth/ProtectedArea';
import { AUTH_CALLBACK_PATH, createZitadelAuthProviderProps } from './auth/zitadel-config';
import { ContractsListPage } from './contracts/ContractsListPage';
import type { AppShellNavigationItem } from './design-system/AppShell';
import { AppShell } from './design-system/AppShell';
import { DocumentIcon, TruckIcon } from './design-system/icons';
import { DeliveryAuthorizationDetailPage } from './delivery-authorizations/DeliveryAuthorizationDetailPage';
import { DeliveryAuthorizationsListPage } from './delivery-authorizations/DeliveryAuthorizationsListPage';
import { DeliveryAuthorizationsOpenPage } from './delivery-authorizations/DeliveryAuthorizationsOpenPage';

// Relativ zu "heute" berechnet, damit die Demo-Daten nicht mit der Zeit
// sichtbar veralten -- analog zu getDefaultDeliveryAuthorizationDateRange()
// in delivery-authorizations/date-range-default.ts.
const today = new Date();
const currentYear = today.getFullYear();
const todayIso = today.toISOString().slice(0, 10);

const DEMO_DATA = {
  contracts: [
    {
      id: 'demo-contract-1',
      contractNumber: 'DEMO-KONTRAKT-1',
      articleOrProductGroup: 'Demo-Warengruppe',
      agreedQuantity: { value: 100, unit: 'kg' },
      validFrom: `${currentYear}-01-01`,
      validTo: `${currentYear}-12-31`,
      status: 'active' as const,
    },
  ],
  lastSuccessfulSyncAt: `${todayIso}T08:00:00Z`,
  isStale: false,
};

const NAVIGATION_ITEMS: AppShellNavigationItem[] = [
  { label: 'Kontrakte', to: '/contracts', icon: <DocumentIcon /> },
  { label: 'Lieferberechtigungen', to: '/delivery-authorizations', icon: <TruckIcon /> },
];

/**
 * Geschützter Portalbereich: Navigation (AC3) + die eigentlichen Seiten.
 *
 * Der `<ProtectedArea>`-Login-Zwang war vom 2026-08-07 bis 2026-09-03
 * bewusst entfernt, weil der reale ZITADEL-Login im damaligen Deployment
 * nicht zuverlässig funktionierte (offene Punkte: Redirect-URI/Umgebungs-
 * konfiguration in der ZITADEL-Konsole). Seit 2026-09-03 wieder aktiv --
 * ob das zugrunde liegende Konfigurationsproblem tatsächlich behoben ist,
 * wird erst durch einen echten Login-Versuch auf dem Deployment sichtbar.
 *
 * ERNEUT DEAKTIVIEREN (falls der Login weiterhin nicht zuverlässig
 * funktioniert): `<ProtectedArea>...</ProtectedArea>` unten wieder
 * entfernen und `<AppShell>...</AppShell>` direkt zurückgeben -- genauso
 * simpel wie beim ersten Mal, kein Feature-Flag/keine Umgebungsvariable
 * nötig.
 */
function Portal() {
  return (
    <ProtectedArea>
      <AppShell navigationItems={NAVIGATION_ITEMS}>
        <LogoutButton />
        <Routes>
          <Route path="/" element={<Navigate to="/contracts" replace />} />
          <Route path="/contracts" element={<ContractsListPage data={DEMO_DATA} />} />
          <Route path="/delivery-authorizations" element={<DeliveryAuthorizationsListPage />} />
          <Route path="/delivery-authorizations/open" element={<DeliveryAuthorizationsOpenPage />} />
          <Route path="/delivery-authorizations/:id" element={<DeliveryAuthorizationDetailPage />} />
        </Routes>
      </AppShell>
    </ProtectedArea>
  );
}

export function App() {
  return (
    <AuthProvider {...createZitadelAuthProviderProps()}>
      <BrowserRouter>
        <Routes>
          {/* Der OIDC-Callback-Pfad liegt bewusst AUSSERHALB von ProtectedArea:
              während des Code-Austauschs ist der Nutzer noch nicht authentifiziert. */}
          <Route path={AUTH_CALLBACK_PATH} element={<AuthCallbackPage />} />
          <Route path="/*" element={<Portal />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
