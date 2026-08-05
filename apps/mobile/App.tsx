/**
 * Expo-App-Shell mit echtem OIDC-Login-Flow (Authorization Code Flow +
 * PKCE gegen ZITADEL Cloud, siehe `src/auth/ZitadelAuthProvider.tsx`).
 * Kein Routing-Framework -- dieselbe minimale bedingte Rendering-
 * Strategie wie `apps/web/src/App.tsx` (`ProtectedArea` zeigt
 * `LoginScreen` statt geschützter Inhalte, solange niemand angemeldet
 * ist).
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { LogoutButton } from './src/auth/LogoutButton';
import { ProtectedArea } from './src/auth/ProtectedArea';
import { ZitadelAuthProvider } from './src/auth/ZitadelAuthProvider';

export default function App() {
  return (
    <ZitadelAuthProvider>
      <ProtectedArea>
        <View style={styles.container}>
          <Text>Lieferanten-Extranet</Text>
          <LogoutButton />
          <StatusBar style="auto" />
        </View>
      </ProtectedArea>
    </ZitadelAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
