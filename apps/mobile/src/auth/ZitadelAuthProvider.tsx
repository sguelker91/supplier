/**
 * Übernimmt für `apps/mobile` die Rolle, die `react-oidc-context` auf Web
 * spielt (dort nicht wiederverwendbar, da browser-/DOM-gebunden): ein
 * React-Context, der den Authorization-Code-Flow mit PKCE gegen ZITADEL
 * via `expo-auth-session` kapselt und ein `useAuth()`-Hook mit derselben
 * Formsprache wie Web (`isLoading`, `isAuthenticated`, `error`, `login`,
 * `logout`) bereitstellt, damit `LoginScreen`/`LogoutButton`/
 * `ProtectedArea` sich fast identisch zu ihren Web-Pendants lesen.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import type { AuthenticationSession } from './auth-client';
import { clearSession, loadStoredSession, saveSession } from './secure-token-store';
import {
  AUTH_REDIRECT_PATH,
  AUTH_SCHEME,
  AUTH_SCOPES,
  ZITADEL_ISSUER,
  ZITADEL_MOBILE_CLIENT_ID,
} from './zitadel-config';

// Von `expo-auth-session` vorgeschriebene Boilerplate, damit ein
// abgeschlossener Auth-Vorgang den Browser-Tab/-Overlay wieder schließt.
WebBrowser.maybeCompleteAuthSession();

export interface ZitadelAuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: AuthenticationSession | undefined;
  error: Error | undefined;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const ZitadelAuthContext = createContext<ZitadelAuthContextValue | undefined>(undefined);

export function useAuth(): ZitadelAuthContextValue {
  const context = useContext(ZitadelAuthContext);
  if (!context) {
    throw new Error('useAuth() muss innerhalb von <ZitadelAuthProvider> aufgerufen werden.');
  }
  return context;
}

export function ZitadelAuthProvider(props: { children: ReactNode }) {
  const discovery = AuthSession.useAutoDiscovery(ZITADEL_ISSUER);
  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: AUTH_SCHEME, path: AUTH_REDIRECT_PATH }),
    [],
  );
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ZITADEL_MOBILE_CLIENT_ID,
      scopes: AUTH_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  const [session, setSession] = useState<AuthenticationSession | undefined>(undefined);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = await loadStoredSession();
      if (cancelled) {
        return;
      }
      if (stored && stored.expiresAt > Math.floor(Date.now() / 1000)) {
        setSession(stored);
      } else if (stored) {
        await clearSession();
      }
      setIsRestoring(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(): Promise<void> {
    if (!request || !discovery) {
      throw new Error('Zitadel-Login ist noch nicht bereit (Discovery/Request lädt noch).');
    }

    setError(undefined);
    const result = await promptAsync();

    if (result.type === 'success') {
      try {
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: ZITADEL_MOBILE_CLIENT_ID,
            code: result.params.code,
            redirectUri,
            extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
          },
          discovery,
        );

        const newSession: AuthenticationSession = {
          accessToken: tokenResponse.accessToken,
          expiresAt: tokenResponse.expiresIn
            ? Math.floor(Date.now() / 1000) + tokenResponse.expiresIn
            : Number.POSITIVE_INFINITY,
        };
        await saveSession(newSession);
        setSession(newSession);
      } catch (exchangeError) {
        setError(
          exchangeError instanceof Error ? exchangeError : new Error('Token-Austausch fehlgeschlagen.'),
        );
      }
    } else if (result.type === 'error') {
      setError(new Error(result.error?.message ?? 'Anmeldung fehlgeschlagen.'));
    }
    // result.type 'cancel'/'dismiss'/'opened'/'locked' -> Nutzer hat
    // abgebrochen bzw. der Vorgang läuft noch; kein Fehlerzustand.
  }

  async function logout(): Promise<void> {
    // Bewusst NUR lokales Löschen der Sitzung: ein RP-initiated Logout
    // gegen ZITADELs End-Session-Endpoint würde eine registrierte
    // Post-Logout-Redirect-URI für die Mobile-Applikation voraussetzen,
    // die laut ADR 0004 bislang nicht eingerichtet ist. Ohne verifizierte
    // Registrierung würde ein Redirect dorthin auf ZITADEL-Seite
    // fehlschlagen statt die Sitzung sauber zu beenden -- lokales Löschen
    // ist der zuverlässige, garantiert korrekte Teil von "Logout" aus
    // App-Sicht und wird hier nicht um eine unverifizierte Annahme
    // erweitert.
    await clearSession();
    setSession(undefined);
  }

  const value = useMemo<ZitadelAuthContextValue>(
    () => ({
      isLoading: isRestoring,
      isAuthenticated: session !== undefined,
      session,
      error,
      login,
      logout,
    }),
    [isRestoring, session, error, request, discovery],
  );

  return <ZitadelAuthContext.Provider value={value}>{props.children}</ZitadelAuthContext.Provider>;
}
