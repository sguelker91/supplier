/**
 * Verifiziert, dass die `AuthProvider`-Konfiguration die in ADR 0004
 * dokumentierten realen ZITADEL-Werte verwendet (Authorization Code Flow
 * mit PKCE, Public Client -- kein Client-Secret).
 */
import { AUTH_CALLBACK_PATH, createZitadelAuthProviderProps, ZITADEL_ISSUER, ZITADEL_WEB_CLIENT_ID } from './zitadel-config';

describe('createZitadelAuthProviderProps', () => {
  it('baut die Konfiguration aus den in ADR 0004 dokumentierten Werten auf', () => {
    const config = createZitadelAuthProviderProps('https://synthetic-app.example');

    expect(config.authority).toBe(ZITADEL_ISSUER);
    expect(config.client_id).toBe(ZITADEL_WEB_CLIENT_ID);
    expect(config.redirect_uri).toBe(`https://synthetic-app.example${AUTH_CALLBACK_PATH}`);
    expect(config.post_logout_redirect_uri).toBe('https://synthetic-app.example');
    expect(config.response_type).toBe('code');
  });

  it('enthält kein Client-Secret (Public Client mit PKCE, ADR 0004 Punkt 1)', () => {
    const config = createZitadelAuthProviderProps('https://synthetic-app.example');

    expect(config).not.toHaveProperty('client_secret');
  });

  it('fällt ohne explizites origin-Argument auf window.location.origin zurück', () => {
    const config = createZitadelAuthProviderProps();

    expect(config.redirect_uri).toBe(`${window.location.origin}${AUTH_CALLBACK_PATH}`);
  });
});
