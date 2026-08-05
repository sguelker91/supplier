/**
 * Test für `ZitadelAuthProvider`/`useAuth()` -- übernimmt für `apps/mobile`
 * die Rolle, die `react-oidc-context` auf Web spielt (dort eine Blackbox,
 * hier first-party Code, daher ohne direktes Web-Pendant).
 *
 * `expo-auth-session`, `expo-web-browser` und `./secure-token-store`
 * werden vollständig gemockt -- kein echter Netzwerkaufruf/Browser-Start/
 * Keychain-Zugriff in Tests. Ausschließlich synthetische Testdaten
 * (CLAUDE.md, "Sensible Daten").
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, Text } from 'react-native';
import { useState } from 'react';

import type { AuthenticationSession } from './auth-client';
import { useAuth, ZitadelAuthProvider } from './ZitadelAuthProvider';

// CI-Runner sind teils spürbar langsamer als die lokale Entwicklungsumgebung
// (beobachtet: Jests Default-Timeout von 5000ms reichte lokal immer, schlug
// in GitHub Actions aber vereinzelt fehl) -- die gemockten Promises lösen
// sofort auf, hier geht es nur um Puffer für den CI-Runner, nicht um eine
// tatsächlich lang laufende Operation.
jest.setTimeout(10000);

const mockUseAutoDiscovery = jest.fn();
const mockUseAuthRequest = jest.fn();
const mockPromptAsync = jest.fn();
const mockExchangeCodeAsync = jest.fn();
const mockLoadStoredSession = jest.fn();
const mockSaveSession = jest.fn();
const mockClearSession = jest.fn();

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  useAutoDiscovery: (...args: unknown[]) => mockUseAutoDiscovery(...args),
  useAuthRequest: (...args: unknown[]) => mockUseAuthRequest(...args),
  exchangeCodeAsync: (...args: unknown[]) => mockExchangeCodeAsync(...args),
  makeRedirectUri: jest.fn(() => 'supplierextranet://auth/callback'),
  ResponseType: { Code: 'code' },
}));

jest.mock('./secure-token-store', () => ({
  loadStoredSession: (...args: unknown[]) => mockLoadStoredSession(...args),
  saveSession: (...args: unknown[]) => mockSaveSession(...args),
  clearSession: (...args: unknown[]) => mockClearSession(...args),
}));

const SYNTHETIC_DISCOVERY = { tokenEndpoint: 'https://synthetic-zitadel.example/token' };
const SYNTHETIC_REQUEST = { codeVerifier: 'synthetic-code-verifier' };

function AuthConsumer() {
  const auth = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  async function handleLoginPress() {
    setLoginError(null);
    try {
      await auth.login();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'unknown');
    }
  }

  return (
    <>
      <Text testID="isLoading">{String(auth.isLoading)}</Text>
      <Text testID="isAuthenticated">{String(auth.isAuthenticated)}</Text>
      {auth.error ? <Text accessibilityRole="alert">{auth.error.message}</Text> : null}
      {loginError ? <Text testID="loginError">{loginError}</Text> : null}
      <Button title="login" accessibilityLabel="login" onPress={handleLoginPress} />
      <Button title="logout" accessibilityLabel="logout" onPress={() => auth.logout()} />
    </>
  );
}

function renderWithProvider() {
  return render(
    <ZitadelAuthProvider>
      <AuthConsumer />
    </ZitadelAuthProvider>,
  );
}

describe('ZitadelAuthProvider / useAuth', () => {
  beforeEach(() => {
    mockUseAutoDiscovery.mockReset().mockReturnValue(SYNTHETIC_DISCOVERY);
    mockUseAuthRequest.mockReset().mockReturnValue([SYNTHETIC_REQUEST, null, mockPromptAsync]);
    mockPromptAsync.mockReset();
    mockExchangeCodeAsync.mockReset();
    mockLoadStoredSession.mockReset().mockResolvedValue(undefined);
    mockSaveSession.mockReset().mockResolvedValue(undefined);
    mockClearSession.mockReset().mockResolvedValue(undefined);
  });

  it('restauriert eine gespeicherte, noch gültige Sitzung beim Start', async () => {
    const storedSession: AuthenticationSession = {
      accessToken: 'synthetic-stored-token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    mockLoadStoredSession.mockResolvedValue(storedSession);

    await renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    expect(mockClearSession).not.toHaveBeenCalled();
  });

  it('verwirft eine abgelaufene gespeicherte Sitzung', async () => {
    const expiredSession: AuthenticationSession = {
      accessToken: 'synthetic-expired-token',
      expiresAt: Math.floor(Date.now() / 1000) - 3600,
    };
    mockLoadStoredSession.mockResolvedValue(expiredSession);

    await renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });

  it('wirft, wenn Login aufgerufen wird, bevor Discovery/Request bereit sind', async () => {
    mockUseAuthRequest.mockReturnValue([null, null, mockPromptAsync]);
    await renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));
    fireEvent.press(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByTestId('loginError')).toHaveTextContent(
      'Zitadel-Login ist noch nicht bereit (Discovery/Request lädt noch).',
    );
    expect(mockPromptAsync).not.toHaveBeenCalled();
  });

  it('tauscht bei erfolgreichem Login den Code gegen ein Token und speichert die Sitzung', async () => {
    mockPromptAsync.mockResolvedValue({
      type: 'success',
      params: { code: 'synthetic-authorization-code' },
    });
    mockExchangeCodeAsync.mockResolvedValue({
      accessToken: 'synthetic-exchanged-access-token',
      expiresIn: 3600,
    });
    await renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    fireEvent.press(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));
    expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'synthetic-authorization-code',
        redirectUri: 'supplierextranet://auth/callback',
        extraParams: { code_verifier: 'synthetic-code-verifier' },
      }),
      SYNTHETIC_DISCOVERY,
    );
    expect(mockSaveSession).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'synthetic-exchanged-access-token' }),
    );
  });

  it('zeigt einen Fehler, wenn der Token-Austausch fehlschlägt', async () => {
    mockPromptAsync.mockResolvedValue({
      type: 'success',
      params: { code: 'synthetic-authorization-code' },
    });
    mockExchangeCodeAsync.mockRejectedValue(new Error('synthetic-token-exchange-error'));
    await renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    fireEvent.press(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetic-token-exchange-error');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
  });

  it('zeigt einen Fehler, wenn der Provider den Auth-Vorgang mit einem Fehler beendet', async () => {
    mockPromptAsync.mockResolvedValue({
      type: 'error',
      params: {},
      errorCode: null,
      authentication: null,
      url: '',
      error: { message: 'synthetic-provider-error' },
    });
    await renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('isLoading')).toHaveTextContent('false'));

    fireEvent.press(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('synthetic-provider-error');
  });

  it('löscht bei Logout die lokal gespeicherte Sitzung', async () => {
    const storedSession: AuthenticationSession = {
      accessToken: 'synthetic-stored-token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    };
    mockLoadStoredSession.mockResolvedValue(storedSession);
    await renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true'));

    fireEvent.press(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false'));
    expect(mockClearSession).toHaveBeenCalledTimes(1);
  });
});
