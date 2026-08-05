/**
 * Rendering-Test für die App-Shell (jest-expo-Preset, react-test-renderer).
 * `ZitadelAuthProvider`/`useAuth` wird gemockt, damit dieser reine
 * Smoke-Test keinen echten OIDC-Discovery-Netzwerkaufruf auslöst -- die
 * eigentliche Auth-Logik wird bereits dediziert in
 * `src/auth/ZitadelAuthProvider.spec.tsx` und den Komponenten-Tests unter
 * `src/auth/` abgedeckt.
 */
import type { ReactNode } from 'react';
import { act, create } from 'react-test-renderer';

import App from './App';

jest.mock('./src/auth/ZitadelAuthProvider', () => ({
  ZitadelAuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    session: undefined,
    error: undefined,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('App', () => {
  it('rendert ohne Fehler (nicht angemeldet -> LoginScreen)', async () => {
    let tree: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    expect(tree!.toJSON()).toBeTruthy();
  });
});
