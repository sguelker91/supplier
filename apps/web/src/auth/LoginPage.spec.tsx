/**
 * Rendering-Test für `LoginPage` (React Testing Library).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 *
 * `react-oidc-context` wird gemockt -- kein echtes Netzwerk/Redirect in
 * Tests (siehe Aufgabenstellung).
 *
 * Deckt AC6 der Story `lieferanten-anmeldung-gpa` ab (kein Self-Signup)
 * sowie den echten Login-Auslöse-Mechanismus (`auth.signinRedirect()` wird
 * über `loginWithZitadel()` aufgerufen).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LoginPage } from './LoginPage';

const signinRedirectMock = jest.fn();

jest.mock('react-oidc-context', () => ({
  useAuth: () => ({
    signinRedirect: signinRedirectMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    signinRedirectMock.mockReset();
  });

  it('zeigt eine Anmelden-Aktion, aber keine Registrierungs-/Sign-up-Option (AC6)', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Anmeldung' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.queryByText(/registrieren/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/konto anlegen/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('löst beim Klick den echten OIDC-Authorization-Code-Flow (PKCE) gegen ZITADEL aus', async () => {
    signinRedirectMock.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => expect(signinRedirectMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('zeigt einen Fehler und meldet ihn über onLoginError, wenn signinRedirect fehlschlägt', async () => {
    const syntheticError = new Error('synthetic-signin-redirect-error');
    signinRedirectMock.mockRejectedValue(syntheticError);
    const onLoginError = jest.fn();

    render(<LoginPage onLoginError={onLoginError} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetic-signin-redirect-error');
    expect(onLoginError).toHaveBeenCalledTimes(1);
    expect(onLoginError).toHaveBeenCalledWith(syntheticError);
  });
});
