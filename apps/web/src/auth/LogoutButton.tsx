/**
 * Aktive Abmeldung (AC9 der Story `lieferanten-anmeldung-gpa`). Beendet die
 * lokale `react-oidc-context`-Sitzung und leitet zusätzlich zum ZITADEL
 * End-Session-Endpoint weiter (`auth.signoutRedirect()`, siehe
 * `auth-client.ts`), sodass ein erneuter Zugriff auf geschützte Bereiche
 * eine vollständige erneute Anmeldung inklusive Okta-MFA erfordert.
 *
 * Bewusst keine eigene Bestätigungs-/Lade-UI -- das ist über den Scope
 * dieser Story hinausgehende UX-Ausgestaltung, kein Akzeptanzkriterium.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { useAuth } from 'react-oidc-context';

import { logoutFromZitadel } from './auth-client';

export function LogoutButton() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return null;
  }

  async function handleLogoutClick() {
    await logoutFromZitadel(auth);
  }

  return (
    <button type="button" onClick={handleLogoutClick}>
      Abmelden
    </button>
  );
}
