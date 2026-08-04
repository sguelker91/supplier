/**
 * BEWUSST WEITERHIN PLATZHALTER: kein echtes OIDC-SDK eingebunden. Läuft
 * jetzt als echter TypeScript-Code im React+Vite-Projekt (`apps/web`,
 * siehe `vite.config.ts`/`package.json`), aber `loginWithZitadel()` bleibt
 * eine reine Signatur ohne Implementierung -- ein echtes SDK (z. B.
 * `oidc-client-ts`) ist laut ADR 0004 ("Konsequenzen": Bibliothekswahl
 * offen) weiterhin nicht entschieden/integriert.
 *
 * Zeigt den Ablauf, den laut ADR 0004 Punkt 1/2 ein künftiges echtes SDK
 * kapseln würde: Authorization Code Flow + PKCE gegen ZITADEL Cloud, und
 * wie das resultierende Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an Requests gegen `apps/api` angehängt
 * wird.
 *
 * ECHTE IMPLEMENTIERUNG (bewusst NICHT Teil dieses Konturwurfs): PKCE
 * Code-Verifier/-Challenge-Erzeugung, Redirect zu ZITADEL, Code-Exchange
 * gegen den ZITADEL-Token-Endpoint, sichere Token-Ablage (z. B.
 * In-Memory + Silent Refresh statt `localStorage`, wegen XSS-Risiko bei
 * dauerhaft persistierten Tokens) — das übernimmt normalerweise eine
 * geprüfte OIDC-Bibliothek, keine Eigenimplementierung.
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
 * Umsetzung den Nutzer zu ZITADEL umleiten (Authorization Code Flow +
 * PKCE, ADR 0004 Punkt 2) und nach Rückkehr den Autorisierungscode gegen
 * ein Token tauschen. Bewusst als `declare function` markiert, um zu
 * zeigen, dass hier KEIN echtes SDK/keine echte Implementierung existiert.
 */
export declare function loginWithZitadel(
  config: OidcClientConfig,
): Promise<AuthenticationSession>;

/**
 * Hängt das Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an einen Request gegen `apps/api` an.
 * Dies ist der EINZIGE Mechanismus, über den `apps/web` seine Identität
 * gegenüber `apps/api` nachweist — niemals ein eigener, client-gesetzter
 * Header wie `X-Supplier-Id` (siehe kritischer Security-Befund in
 * `docs/security/lieferant-kontrakte-einsehen.md`: "supplierId ... niemals
 * aus einem vom Client setzbaren Header/Cookie-Wert ohne
 * Signaturprüfung").
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

/**
 * Beispiel, wie ein Contracts-Request in `apps/web` (siehe
 * `../contracts/ContractsListPage.tsx`) das Access-Token nutzen würde.
 * Kein echter Fetch/HTTP-Client-Aufbau ist hier entschieden — reine
 * Konturskizze.
 */
export async function fetchMyContracts(
  apiBaseUrl: string,
  session: AuthenticationSession,
): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}/contracts`, withAuthHeader(session));

  if (response.status === 401) {
    // AC7: fehlende/abgelaufene Session -> Weiterleitung zur Anmeldeseite.
    // Konkrete Redirect-/Refresh-Logik ist Teil des noch offenen
    // SDK-/Routing-Setups, nicht dieses Konturwurfs.
    throw new Error('Nicht authentifiziert — erneuter Login erforderlich.');
  }

  if (!response.ok) {
    throw new Error(`Request fehlgeschlagen: ${response.status}`);
  }

  return response.json();
}
