/**
 * Login-Einstiegspunkt für `apps/mobile`, jetzt mit echtem OIDC-Login-Flow
 * (Authorization Code Flow + PKCE gegen ZITADEL Cloud über
 * `expo-auth-session`, siehe `ZitadelAuthProvider.tsx`/`zitadel-
 * config.ts`).
 *
 * Analog zu `apps/web/src/auth/auth-client.ts`: dünne Wrapper-Funktionen
 * um den Auth-Kontext (dort `react-oidc-context`, hier
 * `ZitadelAuthProvider`s `useAuth()`), damit `LoginScreen`/`LogoutButton`
 * denselben schlanken Aufrufstil verwenden können.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

/** Ergebnis eines erfolgreichen Logins. */
export interface AuthenticationSession {
  accessToken: string;
  /** Unix-Timestamp (Sekunden), ab dem das Token erneuert werden muss. */
  expiresAt: number;
}

/** Minimaler Vertrag, den `ZitadelAuthProvider`s `useAuth()`-Rückgabewert erfüllen muss. */
export interface ZitadelAuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Löst den Authorization-Code-Flow mit PKCE gegen ZITADEL aus (System-
 * Browser via `expo-web-browser`). Wirft, wenn der Auth-Kontext das
 * Login (noch) nicht ausführen kann (z. B. `AuthRequest` noch nicht
 * geladen) -- kein stiller Fehlschlag.
 */
export async function loginWithZitadel(auth: ZitadelAuthActions): Promise<void> {
  await auth.login();
}

/** Beendet die lokale Sitzung und den ZITADEL-End-Session-Ablauf. */
export async function logoutFromZitadel(auth: ZitadelAuthActions): Promise<void> {
  await auth.logout();
}

/**
 * Hängt das Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an einen Request gegen `apps/api` an --
 * identisches Muster wie in `apps/web`, da `apps/api` bewusst
 * client-typ-unabhängig denselben zustandslosen Verifikationspfad für
 * Web und Mobile nutzt.
 */
export function withAuthHeader(
  session: AuthenticationSession,
  init: RequestInit = {},
): RequestInit {
  return {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${session.accessToken}`,
    },
  };
}
