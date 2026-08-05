/**
 * Login-Einstiegspunkt für `apps/mobile`, Pendant zu
 * `apps/web/src/auth/LoginPage.tsx`.
 *
 * AC6 der Story `lieferanten-anmeldung-gpa` (kein Self-Signup): Dieser
 * Screen bietet ausschließlich eine "Anmelden"-Aktion für bestehende
 * Zugangsdaten -- bewusst KEIN Registrierungs-/Sign-up-Element.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { loginWithZitadel } from './auth-client';
import { useAuth } from './ZitadelAuthProvider';

export function LoginScreen() {
  const auth = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginPress() {
    setErrorMessage(null);
    try {
      await loginWithZitadel(auth);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Anmeldung</Text>
      <Text>
        Melden Sie sich mit Ihren bestehenden Zugangsdaten am Lieferanten-Extranet an. Im
        Anschluss ist eine Multi-Faktor-Authentifizierung über Okta erforderlich.
      </Text>
      {/*
        AC6: bewusst KEIN Registrierungs-/Sign-up-Element -- die einzige
        sichtbare Möglichkeit ist die Anmeldung mit bereits bestehenden
        Zugangsdaten.
      */}
      <Button title="Anmelden" accessibilityLabel="Anmelden" onPress={handleLoginPress} />
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
  },
  error: {
    color: 'red',
  },
});
