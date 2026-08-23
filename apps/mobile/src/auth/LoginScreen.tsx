/**
 * Login-Einstiegspunkt für `apps/mobile`, Pendant zu
 * `apps/web/src/auth/LoginPage.tsx`.
 *
 * AC6 der Story `lieferanten-anmeldung-gpa` (kein Self-Signup): Dieser
 * Screen bietet ausschließlich eine "Anmelden"-Aktion für bestehende
 * Zugangsdaten -- bewusst KEIN Registrierungs-/Sign-up-Element.
 *
 * Seit der "Modern Minimal"-Überarbeitung (Design-Canvas "Extranet Mobile
 * Modern") ein vertikales Zwei-Bereiche-Layout (dunkles Marken-Panel oben,
 * weißer Formular-Bereich unten) über `flex`-Anteile statt fester Pixel,
 * damit es auf verschiedenen Gerätegrößen skaliert. Bestehender Copy-Text
 * unverändert -- KEINE "Noch keinen Zugang…"-Zeile (AC6), analog zum
 * Web-Pendant.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { loginWithZitadel } from './auth-client';
import { useAuth } from './ZitadelAuthProvider';
import { BrandMarkIcon } from '../design-system/icons';
import { colors, fontFamily, spacing } from '../design-system/theme';

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
      <View style={styles.topPanel}>
        <View style={styles.brandMark}>
          <BrandMarkIcon size={24} color={colors.accent} />
          <Text style={styles.brandMarkText}>Lieferanten-Extranet</Text>
        </View>
        <Text style={styles.tagline}>Ihre Kontrakte und Lieferungen, immer aktuell.</Text>
      </View>

      <View style={styles.bottomPanel}>
        <Text style={styles.kicker}>Lieferanten-Extranet</Text>
        <Text style={styles.heading}>Anmeldung</Text>
        <Text style={styles.description}>
          Melden Sie sich mit Ihren bestehenden Zugangsdaten am Lieferanten-Extranet an. Im
          Anschluss ist eine Multi-Faktor-Authentifizierung über Okta erforderlich.
        </Text>
        {/*
          AC6: bewusst KEIN Registrierungs-/Sign-up-Element -- die einzige
          sichtbare Möglichkeit ist die Anmeldung mit bereits bestehenden
          Zugangsdaten.
        */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Anmelden"
          style={styles.button}
          onPress={handleLoginPress}
        >
          <Text style={styles.buttonText}>Anmelden</Text>
        </Pressable>
        {errorMessage ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topPanel: {
    flex: 1,
    backgroundColor: colors.sidebarBg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  brandMark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMarkText: { fontFamily: fontFamily.bold, fontSize: 14, color: colors.inkInverse },
  tagline: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.inkInverse,
    maxWidth: 280,
  },
  bottomPanel: {
    flex: 2,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fontFamily.bold,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  heading: { fontFamily: fontFamily.extraBold, fontSize: 22, color: colors.textPrimary },
  description: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { fontFamily: fontFamily.bold, fontSize: 15, color: '#fff' },
  error: {
    marginTop: spacing.sm,
    color: '#b91c1c',
    fontFamily: fontFamily.regular,
    fontSize: 13.5,
  },
});
