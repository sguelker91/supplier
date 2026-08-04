/**
 * Test für den OIDC-Redirect-Callback-Handler. `react-oidc-context` wird
 * gemockt -- kein echter Netzwerk-Code-Austausch in Tests (siehe
 * Aufgabenstellung). Der eigentliche Code-Austausch selbst ist Aufgabe von
 * `react-oidc-context`s `<AuthProvider>` (siehe Kommentar in
 * `AuthCallbackPage.tsx`) und daher hier nicht Gegenstand des Tests --
 * geprüft wird ausschließlich, wie diese Komponente auf die vom Provider
 * gelieferten Zustände reagiert.
 *
 * `navigateToProtectedArea()` (`auth-client.ts`) wird ebenfalls gemockt,
 * statt den schreibgeschützten `window.location`-Global in jsdom zu
 * manipulieren.
 */
import { render, screen } from '@testing-library/react';

import { AuthCallbackPage } from './AuthCallbackPage';

const useAuthMock = jest.fn();
const navigateToProtectedAreaMock = jest.fn();

jest.mock('react-oidc-context', () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock('./auth-client', () => ({
  navigateToProtectedArea: () => navigateToProtectedAreaMock(),
}));

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    navigateToProtectedAreaMock.mockReset();
  });

  it('zeigt einen Ladehinweis, während der Code-Austausch läuft', () => {
    useAuthMock.mockReturnValue({ isLoading: true, isAuthenticated: false });

    render(<AuthCallbackPage />);

    expect(screen.getByRole('status')).toHaveTextContent(/abgeschlossen/i);
    expect(navigateToProtectedAreaMock).not.toHaveBeenCalled();
  });

  it('leitet nach erfolgreichem Code-Austausch in den geschützten Bereich weiter', () => {
    useAuthMock.mockReturnValue({ isLoading: false, isAuthenticated: true });

    render(<AuthCallbackPage />);

    expect(navigateToProtectedAreaMock).toHaveBeenCalledTimes(1);
  });

  it('zeigt einen Fehler bei fehlgeschlagenem Code-Austausch, statt still weiterzuleiten', () => {
    const syntheticError = Object.assign(new Error('synthetic-callback-error'), {
      source: 'signinCallback' as const,
    });
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: syntheticError,
    });

    render(<AuthCallbackPage />);

    expect(screen.getByRole('alert')).toHaveTextContent('synthetic-callback-error');
    expect(navigateToProtectedAreaMock).not.toHaveBeenCalled();
  });
});
