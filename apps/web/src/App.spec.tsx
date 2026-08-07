/**
 * Verdrahtungs-Test für `App`: prüft, dass `ProtectedArea`/`LoginPage`/
 * `AuthCallbackPage`/`LogoutButton` tatsächlich zusammengeschaltet sind
 * (AC7/AC9). `react-oidc-context` wird gemockt -- `<AuthProvider>` wird
 * durch eine reine Passthrough-Komponente ersetzt, `useAuth()` liefert je
 * Testfall einen synthetischen Zustand.
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { App } from './App';

const useAuthMock = jest.fn();

jest.mock('react-oidc-context', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => useAuthMock(),
}));

describe('App', () => {
  const originalPathname = window.location.pathname;

  afterEach(() => {
    window.history.replaceState({}, '', originalPathname);
    useAuthMock.mockReset();
  });

  // TEMPORÄR ÜBERSPRUNGEN (2026-08-07): `ProtectedArea` ist in `Portal()`
  // (App.tsx) bewusst deaktiviert, solange der reale ZITADEL-Login im
  // Deployment nicht zuverlässig funktioniert -- siehe Kommentar dort.
  // Diesen Test wieder aktivieren (`.skip` entfernen), sobald
  // `ProtectedArea` in `App.tsx` reaktiviert ist; die Assertions selbst
  // bleiben unverändert korrekt für AC7.
  it.skip('zeigt für nicht angemeldete Nutzer die Anmeldeseite statt der Kontrakte (AC7)', () => {
    useAuthMock.mockReturnValue({ isLoading: false, isAuthenticated: false, signinRedirect: jest.fn() });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Anmeldung' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Kontrakte' })).not.toBeInTheDocument();
  });

  it('zeigt Kontrakte auch ohne Anmeldung (Login-Zwang temporär deaktiviert, siehe App.tsx)', () => {
    useAuthMock.mockReturnValue({ isLoading: false, isAuthenticated: false, signinRedirect: jest.fn() });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Kontrakte' })).toBeInTheDocument();
  });

  it('zeigt für angemeldete Nutzer die Kontrakte inklusive einer Abmelden-Aktion (AC9)', () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      signoutRedirect: jest.fn(),
    });

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Kontrakte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
  });

  it('rendert den Callback-Screen auf der OIDC-Redirect-URI, unabhängig vom aktuellen Anmeldestatus', () => {
    window.history.replaceState({}, '', '/auth/callback?code=synthetic-code&state=synthetic-state');
    useAuthMock.mockReturnValue({ isLoading: true, isAuthenticated: false });

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/abgeschlossen/i);
    expect(screen.queryByRole('heading', { name: 'Anmeldung' })).not.toBeInTheDocument();
  });
});
