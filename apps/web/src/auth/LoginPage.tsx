/**
 * Login-Einstiegspunkt für `apps/web`, jetzt mit echtem OIDC-Login-Flow.
 *
 * ADR-Bezug:
 * - ADR 0004 Punkt 1/2: Der Login-Flow ist ein Authorization-Code-Flow +
 *   PKCE gegen ZITADEL Cloud (siehe `zitadel-config.ts`, `auth-client.ts`).
 * - ADR 0008 Punkt 4 ("Okta als föderierter Identity Provider via Identity
 *   Brokering in ZITADEL"): `apps/web` benötigt aus Client-Sicht KEINE
 *   Okta-spezifische Integration -- Okta ist vollständig hinter ZITADEL
 *   verborgen. Diese Komponente enthält daher bewusst keine Okta-Logik,
 *   löst lediglich denselben OIDC-Redirect gegen ZITADEL aus wie zuvor.
 * - AC6 der Story `lieferanten-anmeldung-gpa` (kein Self-Signup): Diese
 *   Seite bietet ausschließlich eine "Anmelden"-Aktion für bestehende
 *   Zugangsdaten -- bewusst KEIN Registrierungs-/Sign-up-Link oder
 *   -Hinweis.
 *
 * Abweichung von der vorherigen Fassung: `LoginPage` erhält keine
 * `OidcClientConfig`-Prop mehr (Issuer/Client-ID sind jetzt fest in
 * `zitadel-config.ts` hinterlegt, siehe dortige Begründung), sondern
 * bezieht den Auth-Kontext über `useAuth()` (react-oidc-context) aus dem
 * umgebenden `<AuthProvider>` (siehe `App.tsx`). Das entspricht dem von
 * `react-oidc-context` vorgesehenen Nutzungsmuster.
 *
 * Story: docs/backlog/lieferanten-anmeldung-gpa.md
 * ADRs:  docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *        docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

import { useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { loginWithZitadel } from './auth-client';
import styles from './LoginPage.module.css';

export interface LoginPageProps {
  /**
   * Wird aufgerufen, wenn der Login-Auslöser fehlschlägt (z. B. weil die
   * ZITADEL-Discovery-Dokumente nicht geladen werden konnten). Optional,
   * primär zu Testzwecken und für eine künftige Fehler-/Telemetrie-
   * Anbindung.
   */
  onLoginError?: (error: unknown) => void;
}

/**
 * Login-Seite. Zeigt ausschließlich eine "Anmelden"-Aktion für bestehende
 * Zugangsdaten (AC6: kein Self-Signup) und löst beim Klick den
 * echten OIDC-Authorization-Code-Flow mit PKCE gegen ZITADEL aus.
 */
export function LoginPage(props: LoginPageProps) {
  const { onLoginError } = props;
  const auth = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginClick() {
    setErrorMessage(null);
    try {
      await loginWithZitadel(auth);
      // Bei Erfolg verlässt der Browser die Seite (Redirect zu ZITADEL) --
      // es gibt hier keinen weiteren Erfolgspfad zu behandeln. Rückkehr
      // und Token-Austausch übernimmt `AuthCallbackPage`.
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.');
      onLoginError?.(error);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>Lieferanten-Extranet</p>
        <h1 className={styles.heading}>Anmeldung</h1>
        <p className={styles.description}>
          Melden Sie sich mit Ihren bestehenden Zugangsdaten am
          Lieferanten-Extranet an. Im Anschluss ist eine
          Multi-Faktor-Authentifizierung über Okta erforderlich.
        </p>
        {/*
          AC6: bewusst KEIN Registrierungs-/Sign-up-Link oder -Hinweis --
          die einzige im Extranet sichtbare Möglichkeit ist die Anmeldung
          mit bereits bestehenden Zugangsdaten.
        */}
        <button type="button" className={styles.button} onClick={handleLoginClick}>
          Anmelden
        </button>
        {errorMessage ? (
          <p role="alert" className={styles.error}>
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
