/**
 * Echte OIDC-Client-Integration für `apps/web` auf Basis von
 * `react-oidc-context`/`oidc-client-ts` (Authorization Code Flow mit PKCE
 * gegen ZITADEL Cloud, siehe `zitadel-config.ts`).
 *
 * ADR-Bezug:
 * - ADR 0004 Punkt 1/2: Authorization Code Flow + PKCE gegen ZITADEL Cloud,
 *   Token wird als `Authorization: Bearer`-Header an `apps/api` gesendet.
 * - ADR 0008 Punkt 4: Okta-MFA läuft vollständig hinter ZITADEL verborgen
 *   (Identity Brokering) -- aus Sicht von `apps/web` bleibt es ein
 *   gewöhnlicher OIDC-Redirect-Flow gegen ZITADEL, keine Okta-spezifische
 *   Logik hier.
 *
 * Abweichung von der vorherigen Implementierungsnotiz (siehe
 * `docs/backlog/lieferanten-anmeldung-gpa.md`): `loginWithZitadel()` wirft
 * nicht mehr immer einen Fehler, sondern löst über den von
 * `react-oidc-context` bereitgestellten Auth-Kontext (`useAuth()`) den
 * echten `signinRedirect()`-Aufruf aus. PKCE-Code-Verifier/-Challenge,
 * Redirect zu ZITADEL und der eigentliche Code-Austausch gegen den
 * ZITADEL-Token-Endpoint sind jetzt durch `oidc-client-ts` implementiert,
 * keine Eigenimplementierung.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

import type { AuthContextProps } from 'react-oidc-context';

/**
 * Löst den Authorization-Code-Flow mit PKCE gegen ZITADEL aus (Redirect zu
 * ZITADEL). `auth` ist der von `useAuth()` (react-oidc-context) gelieferte
 * Kontext einer Komponente unterhalb von `<AuthProvider>` (siehe
 * `App.tsx`/`zitadel-config.ts`). Wirft weiterhin einen Fehler, wenn der
 * Redirect-Versuch selbst fehlschlägt (z. B. Netzwerkproblem beim Laden der
 * ZITADEL-Discovery-Dokumente) -- kein stiller Fehlschlag.
 */
export async function loginWithZitadel(auth: AuthContextProps): Promise<void> {
  await auth.signinRedirect();
}

/**
 * Beendet die lokale Sitzung und meldet den Nutzer zusätzlich bei ZITADEL
 * ab (AC9): `signoutRedirect()` leitet zum ZITADEL End-Session-Endpoint
 * weiter (von `oidc-client-ts` aus den Discovery-Dokumenten der Instanz
 * aufgelöst, siehe `zitadel-config.ts`), sodass ein erneuter Zugriff auf
 * geschützte Bereiche eine vollständige erneute Anmeldung inklusive
 * Okta-MFA erfordert.
 */
export async function logoutFromZitadel(auth: AuthContextProps): Promise<void> {
  await auth.signoutRedirect();
}

/**
 * Navigiert nach einem erfolgreichen OIDC-Redirect-Callback
 * (`AuthCallbackPage`) zurück in den geschützten Bereich der App. Als
 * eigene, kleine Funktion ausgelagert (statt `window.location.assign`
 * direkt in der Komponente aufzurufen), damit Tests diesen einen
 * Navigations-Seiteneffekt gezielt mocken können, ohne den
 * schreibgeschützten `window.location`-Global in jsdom manipulieren zu
 * müssen.
 */
export function navigateToProtectedArea(): void {
  window.location.assign('/');
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
 *
 * Wirft absichtlich einen Fehler statt einen Request ohne Token
 * abzusetzen, wenn kein Access-Token vorliegt (z. B. Sitzung abgelaufen,
 * bevor die anfragende Komponente das bemerkt hat) -- kein unauthentifizierter
 * Fallback-Request gegen lieferantenscoped Endpunkte.
 */
export function withAuthHeader(
  accessToken: string | undefined,
  init: RequestInit = {},
): RequestInit {
  if (!accessToken) {
    throw new Error(
      'withAuthHeader() benötigt ein Access-Token -- kein Request gegen apps/api ohne ' +
        'Authentifizierung (AC7: nicht angemeldete Nutzer erhalten keine Daten).',
    );
  }

  return {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

/**
 * Beispiel, wie ein Contracts-Request in `apps/web` (siehe
 * `../contracts/ContractsListPage.tsx`) das Access-Token nutzen würde.
 * `apiBaseUrl` und der konkrete Zeitpunkt des Aufrufs (z. B. beim Mounten
 * einer Routing-/Datenlade-Schicht) sind weiterhin nicht Teil dieses
 * Konturwurfs -- `App.tsx` rendert aktuell weiterhin Demo-Daten für
 * `ContractsListPage` (siehe Implementierungsnotiz), da ein echtes
 * Daten-Fetching-Konzept (Cache, Ladezustände, Fehleranzeige) über den
 * Scope dieser Story hinausgeht.
 */
export async function fetchMyContracts(
  apiBaseUrl: string,
  accessToken: string | undefined,
): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}/contracts`, withAuthHeader(accessToken));

  if (response.status === 401) {
    // AC7: fehlende/abgelaufene Session -> Weiterleitung zur Anmeldeseite
    // erfolgt bereits vorher durch `ProtectedArea` (siehe `App.tsx`); ein
    // 401 an dieser Stelle bedeutet, dass ein zuvor gültiges Token
    // zwischenzeitlich abgelaufen ist.
    throw new Error('Nicht authentifiziert — erneuter Login erforderlich.');
  }

  if (!response.ok) {
    throw new Error(`Request fehlgeschlagen: ${response.status}`);
  }

  return response.json();
}
