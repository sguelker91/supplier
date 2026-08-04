/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, keine echte Expo-App,
 * kein echtes OIDC-SDK eingebunden.
 *
 * Zeigt den Ablauf, den laut ADR 0004 Punkt 1/2 ein künftiges echtes SDK
 * für Expo (naheliegender Kandidat: `expo-auth-session`, unterstützt
 * Authorization Code Flow + PKCE für native Apps) kapseln würde, und wie
 * das resultierende Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an Requests gegen `apps/api` angehängt
 * wird — analog zu `apps/web/src/auth/auth-client.ts`, aber mit
 * Mobile-spezifischen Anmerkungen (sichere Token-Ablage, Redirect-Schema).
 *
 * ECHTE IMPLEMENTIERUNG (bewusst NICHT Teil dieses Konturwurfs, siehe
 * ADR 0003 "Offene technische Entscheidungen" — kein Paketmanager/
 * Expo-Dependency-Setup vorhanden):
 * - PKCE Code-Verifier/-Challenge-Erzeugung und Authorization-Request via
 *   `expo-auth-session` (`useAuthRequest`/`AuthSession.exchangeCodeAsync`).
 * - Sichere Token-Ablage z. B. über `expo-secure-store` (Keychain/Keystore)
 *   statt unverschlüsseltem Storage.
 * - Refresh-Token-Strategie auf Mobile ist laut ADR 0004 ("Konsequenzen":
 *   "Refresh-Token-Rotation auf Mobile") ausdrücklich offen.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 */

import type { OidcClientConfig } from './oidc-config.types';

/** Ergebnis eines erfolgreichen Logins, wie es ein echtes OIDC-SDK liefern würde. */
export interface AuthenticationSession {
  accessToken: string;
  /** Unix-Timestamp (Sekunden), ab dem das Token erneuert werden muss. */
  expiresAt: number;
}

/**
 * PLATZHALTER-SIGNATUR (keine Implementierung): Würde in der echten
 * Umsetzung den Nutzer über den System-Browser/`expo-auth-session` zu
 * ZITADEL umleiten (Authorization Code Flow + PKCE, ADR 0004 Punkt 2) und
 * nach Rückkehr den Autorisierungscode gegen ein Token tauschen. Bewusst
 * als `declare function` markiert, um zu zeigen, dass hier KEIN echtes
 * SDK/keine echte Implementierung existiert.
 */
export declare function loginWithZitadel(
  config: OidcClientConfig,
): Promise<AuthenticationSession>;

/**
 * Hängt das Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an einen Request gegen `apps/api` an —
 * identisches Muster wie in `apps/web`, da `apps/api` laut ADR 0004
 * bewusst client-typ-unabhängig denselben zustandslosen
 * Verifikationspfad für Web und Mobile nutzt.
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
