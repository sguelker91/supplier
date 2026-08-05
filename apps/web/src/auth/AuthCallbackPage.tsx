/**
 * Ziel der OIDC-`redirect_uri` (`AUTH_CALLBACK_PATH`, siehe
 * `zitadel-config.ts`/`App.tsx`). ZITADEL leitet nach erfolgreichem Login
 * (inkl. Okta-MFA über Identity Brokering, ADR 0008 Punkt 4) hierher
 * zurück, mit `code`- und `state`-Query-Parametern im Gepäck.
 *
 * Der eigentliche Code-Austausch gegen den ZITADEL-Token-Endpunkt (PKCE
 * Code-Verifier-Prüfung inklusive) wird NICHT hier implementiert, sondern
 * automatisch von `react-oidc-context`s `<AuthProvider>` durchgeführt: Der
 * Provider erkennt beim Mounten anhand der URL (`code`/`state`-Parameter,
 * siehe `hasAuthParams()`), dass ein Sign-in-Callback aussteht, und ruft
 * intern `userManager.signinCallback()` auf, bevor irgendeine Komponente
 * unterhalb des Providers -- also auch diese -- gerendert wird. Diese
 * Komponente zeigt lediglich den Lade-/Fehlerzustand an und navigiert nach
 * erfolgreichem Abschluss zurück in den geschützten Bereich.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

import { navigateToProtectedArea } from './auth-client';

export function AuthCallbackPage() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      // Kein Routing-Paket in `apps/web` entschieden (siehe App.tsx) --
      // eine vollständige Navigation zur Startseite ist der minimale,
      // robuste Mechanismus, um nach dem Code-Austausch den geschützten
      // Bereich (`ProtectedArea`) zu erreichen.
      navigateToProtectedArea();
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  if (auth.error) {
    return (
      <section>
        <h1>Anmeldung fehlgeschlagen</h1>
        <p role="alert">{auth.error.message}</p>
      </section>
    );
  }

  return (
    <section>
      <p role="status">Anmeldung wird abgeschlossen…</p>
    </section>
  );
}
