/**
 * Erster echter Login-Einstiegspunkt für `apps/web`, analog zur bereits im
 * Bootstrap realisierten `ContractsListPage`
 * (`../contracts/ContractsListPage.tsx`): eine echte, renderbare
 * React-Komponente statt eines reinen Konturwurfs.
 *
 * ADR-Bezug:
 * - ADR 0004 Punkt 1/2: Der Login-Flow ist ein Authorization-Code-Flow +
 *   PKCE gegen ZITADEL Cloud.
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
 * Bewusst weiterhin nicht Teil dieser Komponente (siehe `auth-client.ts`
 * und Implementierungsnotizen in `docs/backlog/lieferanten-anmeldung-gpa.md`):
 * - Kein echtes OIDC-SDK/PKCE -- `loginWithZitadel()` wirft aktuell bewusst
 *   einen klaren Fehler, statt eine unsichere Krypto-Eigenimplementierung
 *   vorzutäuschen (siehe `auth-client.ts`).
 * - Keine Session-/Token-Ablage nach Rückkehr vom IdP.
 * - Kein Routing/Redirect-Verhalten für AC7 (nicht angemeldet -> Login-
 *   Seite) -- das erfordert eine für `apps/web` noch nicht entschiedene
 *   Routing-Lösung und ist nicht Teil dieser Komponente.
 * - Keine Darstellung des Okta-MFA-Schritts selbst (AC1/AC8) -- der läuft
 *   laut ADR 0008 Punkt 4 vollständig auf ZITADEL-/Okta-Seite außerhalb
 *   von `apps/web`.
 *
 * Story: docs/backlog/lieferanten-anmeldung-gpa.md
 * ADRs:  docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *        docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */

import { useState } from 'react';

import { loginWithZitadel } from './auth-client';
import type { OidcClientConfig } from './oidc-config.types';

export interface LoginPageProps {
  /** ZITADEL-Client-Konfiguration (Issuer, Client-ID, Redirect-URI, Scopes). */
  config: OidcClientConfig;
  /**
   * Wird aufgerufen, wenn der Login-Auslöser fehlschlägt (z. B. weil noch
   * kein echtes OIDC-SDK integriert ist). Optional, primär zu Testzwecken
   * und für eine künftige Fehler-/Telemetrie-Anbindung.
   */
  onLoginError?: (error: unknown) => void;
}

/**
 * Login-Seite. Zeigt ausschließlich eine "Anmelden"-Aktion für bestehende
 * Zugangsdaten (AC6: kein Self-Signup) und löst beim Klick den
 * OIDC-Login-Versuch gegen ZITADEL aus.
 */
export function LoginPage(props: LoginPageProps) {
  const { config, onLoginError } = props;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLoginClick() {
    setErrorMessage(null);
    try {
      await loginWithZitadel(config);
      // Nach erfolgreichem Login: Session-/Token-Handling und
      // Weiterleitung ins Extranet sind Teil des noch offenen, echten
      // OIDC-SDK-Setups (siehe Datei-Kommentar) -- hier bewusst nicht
      // vorweggenommen.
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.');
      onLoginError?.(error);
    }
  }

  return (
    <section>
      <h1>Anmeldung</h1>
      <p>
        Melden Sie sich mit Ihren bestehenden Zugangsdaten am
        Lieferanten-Extranet an. Im Anschluss ist eine
        Multi-Faktor-Authentifizierung über Okta erforderlich.
      </p>
      {/*
        AC6: bewusst KEIN Registrierungs-/Sign-up-Link oder -Hinweis --
        die einzige im Extranet sichtbare Möglichkeit ist die Anmeldung
        mit bereits bestehenden Zugangsdaten.
      */}
      <button type="button" onClick={handleLoginClick}>
        Anmelden
      </button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </section>
  );
}
