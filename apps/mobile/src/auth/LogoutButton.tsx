/**
 * Aktive Abmeldung (AC9 der Story `lieferanten-anmeldung-gpa`), Pendant zu
 * `apps/web/src/auth/LogoutButton.tsx`. Beendet die lokal in
 * `expo-secure-store` abgelegte Sitzung (siehe `ZitadelAuthProvider.tsx`
 * für die bewusste Beschränkung auf lokales Löschen statt eines
 * RP-initiated Logout gegen ZITADEL).
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { Button } from 'react-native';

import { logoutFromZitadel } from './auth-client';
import { useAuth } from './ZitadelAuthProvider';

export function LogoutButton() {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return null;
  }

  async function handleLogoutPress() {
    await logoutFromZitadel(auth);
  }

  return <Button title="Abmelden" accessibilityLabel="Abmelden" onPress={handleLogoutPress} />;
}
