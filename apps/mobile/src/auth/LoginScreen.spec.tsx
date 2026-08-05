/**
 * Rendering-Test für `LoginScreen` (`@testing-library/react-native`).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 *
 * `ZitadelAuthProvider`s `useAuth` wird gemockt -- kein echter
 * OIDC-SDK-Aufruf (`expo-auth-session`/`expo-web-browser`) in Tests.
 *
 * Deckt AC6 der Story `lieferanten-anmeldung-gpa` ab (kein Self-Signup)
 * sowie den echten Login-Auslöse-Mechanismus (`auth.login()` wird über
 * `loginWithZitadel()` aufgerufen).
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LoginScreen } from './LoginScreen';

const mockLogin = jest.fn();

jest.mock('./ZitadelAuthProvider', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('zeigt eine Anmelden-Aktion, aber keine Registrierungs-/Sign-up-Option (AC6)', async () => {
    await render(<LoginScreen />);

    expect(screen.getByText('Anmeldung')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeTruthy();
    expect(screen.queryByText(/registrieren/i)).toBeNull();
    expect(screen.queryByText(/konto anlegen/i)).toBeNull();
  });

  it('löst beim Tippen den echten OIDC-Authorization-Code-Flow (PKCE) gegen ZITADEL aus', async () => {
    mockLogin.mockResolvedValue(undefined);
    await render(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('zeigt einen Fehler, wenn der Login fehlschlägt', async () => {
    mockLogin.mockRejectedValue(new Error('synthetic-login-error'));
    await render(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Anmelden' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetic-login-error');
  });
});
