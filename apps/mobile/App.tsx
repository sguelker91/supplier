/**
 * Expo-App-Shell mit echtem OIDC-Login-Flow (Authorization Code Flow +
 * PKCE gegen ZITADEL Cloud, siehe `src/auth/ZitadelAuthProvider.tsx`).
 *
 * Seit der "Modern Minimal"-Überarbeitung (Design-Canvas "Extranet Mobile
 * Modern") echte Navigation über `@react-navigation/bottom-tabs` statt des
 * früheren statischen Platzhalter-Screens -- bewusst nur die zwei heute
 * echten Bereiche (Kontrakte, Lieferberechtigungen) als Tabs, keine
 * Platzhalter-Tabs für im Mockup gezeigte, aber noch nicht gebaute
 * Bereiche. `LogoutButton` (unverändert) hängt an jedem Tab-Screen als
 * `headerRight` statt einer eigenen Einstellungsfläche.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ContractsScreen } from './src/contracts/ContractsScreen';
import { DeliveryAuthorizationsScreen } from './src/delivery-authorizations/DeliveryAuthorizationsScreen';
import { LogoutButton } from './src/auth/LogoutButton';
import { ProtectedArea } from './src/auth/ProtectedArea';
import { ZitadelAuthProvider } from './src/auth/ZitadelAuthProvider';
import { colors } from './src/design-system/theme';
import { DocumentIcon, TruckIcon } from './src/design-system/icons';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ZitadelAuthProvider>
      <SafeAreaProvider>
        <ProtectedArea>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={{
                headerRight: () => <LogoutButton />,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
              }}
            >
              <Tab.Screen
                name="Kontrakte"
                component={ContractsScreen}
                options={{ tabBarIcon: ({ color, size }) => <DocumentIcon color={color} size={size} /> }}
              />
              <Tab.Screen
                name="Lieferberechtigungen"
                component={DeliveryAuthorizationsScreen}
                options={{ tabBarIcon: ({ color, size }) => <TruckIcon color={color} size={size} /> }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </ProtectedArea>
      </SafeAreaProvider>
      <StatusBar style="auto" />
    </ZitadelAuthProvider>
  );
}
