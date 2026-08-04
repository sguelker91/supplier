/**
 * Minimale Expo-App-Shell (Bootstrap). Kein Routing/Login-Flow --
 * `src/auth/auth-client.ts` bleibt bewusst TODO (echter PKCE-Flow, siehe
 * ADR 0004), analog zu apps/web.
 */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Lieferanten-Extranet</Text>
      <StatusBar style="auto" />
    </View>
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
