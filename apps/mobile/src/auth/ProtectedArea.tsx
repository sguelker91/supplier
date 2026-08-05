/**
 * Minimaler Schutzmechanismus für geschützte Bereiche der App (AC7 der
 * Story `lieferanten-anmeldung-gpa`), Pendant zu
 * `apps/web/src/auth/ProtectedArea.tsx` (inkl. des dort im Codex-Review
 * gefundenen Retry-Pfad-Fixes: ein `error` wird zusätzlich zum
 * `LoginScreen` angezeigt statt ihn zu ersetzen, damit immer eine
 * "Anmelden"-Aktion verfügbar bleibt).
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoginScreen } from './LoginScreen';
import { useAuth } from './ZitadelAuthProvider';

export function ProtectedArea(props: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="text">Anmeldestatus wird geprüft…</Text>
      </View>
    );
  }

  if (!auth.isAuthenticated) {
    // AC7: nicht angemeldet -> Anmeldeseite statt geschützter Inhalte,
    // keine Daten werden ausgeliefert. Ein `error` (z. B. gescheiterter
    // Token-Austausch) wird zusätzlich zum LoginScreen angezeigt statt
    // ihn zu ersetzen, damit der "Anmelden"-Button als Retry-Pfad
    // verfügbar bleibt.
    return (
      <View style={styles.container}>
        {auth.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {auth.error.message}
          </Text>
        ) : null}
        <LoginScreen />
      </View>
    );
  }

  return <>{props.children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: 'red',
  },
});
