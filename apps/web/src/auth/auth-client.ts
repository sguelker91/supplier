/**
 * BEWUSST WEITERHIN OHNE ECHTES OIDC-SDK: kein PKCE-/Krypto-Code
 * eingebunden. Läuft als echter TypeScript-Code im React+Vite-Projekt
 * (`apps/web`, siehe `vite.config.ts`/`package.json`) -- ein echtes SDK
 * (z. B. `oidc-client-ts`) ist laut ADR 0004 ("Konsequenzen":
 * Bibliothekswahl offen) weiterhin nicht entschieden/integriert.
 *
 * Zeigt den Ablauf, den laut ADR 0004 Punkt 1/2 ein künftiges echtes SDK
 * kapseln würde: Authorization Code Flow + PKCE gegen ZITADEL Cloud
 * (das laut ADR 0008 Punkt 4 unverändert der einzige Client-seitige Flow
 * bleibt -- Okta-MFA ist über Identity Brokering vollständig hinter
 * ZITADEL verborgen, `apps/web` benötigt KEINE Okta-spezifische Logik),
 * und wie das resultierende Access-Token gemäß ADR 0004 Punkt 2 als
 * `Authorization: Bearer`-Header an Requests gegen `apps/api` angehängt
 * wird.
 *
 * Abweichung von der ursprünglichen ADR-0004-Implementierungsnotiz:
 * `loginWithZitadel()` war dort bewusst als `declare function` (reine
 * Typ-Signatur ohne JS-Laufzeitcode) markiert. Damit ein echter, testbarer
 * Login-Einstiegspunkt (`LoginPage.tsx`) diese Funktion tatsächlich
 * aufrufen kann, ohne zur Laufzeit mit einem verwirrenden
 * "is not a function"-Fehler abzustürzen, ist `loginWithZitadel()` jetzt
 * eine echte, aber bewusst fehlschlagende Funktion: Sie wirft einen klar
 * beschrifteten Fehler statt eine unsichere/unvollständige
 * Krypto-Eigenimplementierung vorzutäuschen. Das ist KEINE funktionierende
 * PKCE-Implementierung -- lediglich ein ehrlicher, aufrufbarer Platzhalter.
 *
 * ECHTE IMPLEMENTIERUNG (bewusst NICHT Teil dieses Konturwurfs): PKCE
 * Code-Verifier/-Challenge-Erzeugung, Redirect zu ZITADEL, Code-Exchange
 * gegen den ZITADEL-Token-Endpoint, sichere Token-Ablage (z. B.
 * In-Memory + Silent Refresh statt `localStorage`, wegen XSS-Risiko bei
 * dauerhaft persistierten Tokens) — das übernimmt normalerweise eine
 * geprüfte OIDC-Bibliothek, keine Eigenimplementierung.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

import type { OidcClientConfig } from './oidc-config.types';

/** Ergebnis eines erfolgreichen Logins, wie es ein echtes OIDC-SDK liefern würde. */
export interface AuthenticationSession {
  accessToken: string;
  /** Unix-Timestamp (Sekunden), ab dem das Token erneuert werden muss. */
  expiresAt: number;
}

/**
 * Würde in der echten Umsetzung den Nutzer zu ZITADEL umleiten
 * (Authorization Code Flow + PKCE, ADR 0004 Punkt 2) und nach Rückkehr den
 * Autorisierungscode gegen ein Token tauschen. Wirft aktuell IMMER einen
 * Fehler, weil kein echtes OIDC-SDK integriert ist (siehe Datei-Kommentar)
 * -- bewusst kein stiller Erfolg, kein erfundenes Token.
 */
export async function loginWithZitadel(
  config: OidcClientConfig,
): Promise<AuthenticationSession> {
  throw new Error(
    'loginWithZitadel() ist noch nicht implementiert: Es fehlt weiterhin eine echte ' +
      'OIDC-Client-SDK-Integration mit PKCE gegen ZITADEL (ADR 0004 Punkt 1/2, ' +
      '"Konsequenzen" -- Bibliothekswahl offen). Dieser Platzhalter wirft bewusst einen ' +
      'Fehler, statt eine unsichere Krypto-Eigenimplementierung vorzutäuschen.',
  );
}

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
