/**
 * Dünner Wrapper um `expo-secure-store` (Keychain/Keystore-backed) für die
 * Persistenz einer `AuthenticationSession`. Analog zum bewusst gewählten
 * `sessionStorage`-Default auf Web (siehe `apps/web/src/auth/zitadel-
 * config.ts`), hier aber mit sicherer nativer Speicherung statt einer
 * eigenen In-Memory-Implementierung -- isoliert außerdem als einzige
 * Stelle, die für Persistenz-Verhalten gemockt werden muss.
 */
import * as SecureStore from 'expo-secure-store';

import type { AuthenticationSession } from './auth-client';

const STORAGE_KEY = 'supplier-extranet.zitadel-session';

export async function loadStoredSession(): Promise<AuthenticationSession | undefined> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as AuthenticationSession;
  } catch {
    // Beschädigter/nicht mehr lesbarer Stored-Value -- als "keine Sitzung"
    // behandeln statt die App abstürzen zu lassen.
    return undefined;
  }
}

export async function saveSession(session: AuthenticationSession): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
