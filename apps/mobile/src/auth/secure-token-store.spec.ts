/**
 * Test für die `expo-secure-store`-Persistenz einer `AuthenticationSession`.
 * `expo-secure-store` wird gemockt -- kein echter Keychain/Keystore-Zugriff
 * in Tests.
 */
import * as SecureStore from 'expo-secure-store';

import type { AuthenticationSession } from './auth-client';
import { clearSession, loadStoredSession, saveSession } from './secure-token-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SYNTHETIC_SESSION: AuthenticationSession = {
  accessToken: 'synthetic-access-token',
  expiresAt: 9_999_999_999,
};

describe('secure-token-store', () => {
  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockReset();
    jest.mocked(SecureStore.setItemAsync).mockReset();
    jest.mocked(SecureStore.deleteItemAsync).mockReset();
  });

  it('liefert undefined, wenn keine Sitzung gespeichert ist', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    await expect(loadStoredSession()).resolves.toBeUndefined();
  });

  it('liefert undefined statt zu werfen, wenn der gespeicherte Wert kaputt/kein JSON ist', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('{not-json');

    await expect(loadStoredSession()).resolves.toBeUndefined();
  });

  it('speichert und lädt eine Sitzung per JSON-Round-Trip', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(SYNTHETIC_SESSION));

    await saveSession(SYNTHETIC_SESSION);
    const loaded = await loadStoredSession();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(SYNTHETIC_SESSION),
    );
    expect(loaded).toEqual(SYNTHETIC_SESSION);
  });

  it('löscht die gespeicherte Sitzung', async () => {
    await clearSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(expect.any(String));
  });
});
