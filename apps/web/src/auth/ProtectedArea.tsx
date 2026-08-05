/**
 * Minimaler Schutzmechanismus für geschützte Bereiche des Extranets (AC7
 * der Story `lieferanten-anmeldung-gpa`): Ein nicht angemeldeter oder nicht
 * mehr authentifizierter Nutzer sieht statt der geschützten Inhalte
 * (aktuell: `ContractsListPage`, siehe `App.tsx`) die `LoginPage`.
 *
 * Bewusst KEINE URL-/History-basierte Weiterleitung (z. B. Navigation zu
 * einer eigenen `/login`-Route): `apps/web` hat bislang keine
 * Routing-Bibliothek entschieden (weder ADR noch bestehender Code, siehe
 * `App.tsx` vor dieser Änderung) -- eine Routing-Entscheidung im
 * Alleingang würde eine nicht-triviale Architekturfrage beantworten, die
 * keiner ADR zugeordnet ist. Stattdessen wird In-Place die `LoginPage`
 * gerendert, was den in AC7 geforderten Effekt ("keine Daten werden
 * ausgeliefert, Nutzer landet auf der Anmeldeseite") ohne neue
 * Architekturentscheidung erreicht. Siehe Implementierungsnotiz im
 * Backlog für die ausführliche Begründung dieser Abweichung.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *      docs/architecture/adr/0008-gpa-mandantenschluessel-mehrfachanmeldung-okta-identity-brokering.md
 */
import type { ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';

import { LoginPage } from './LoginPage';

export function ProtectedArea(props: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.isLoading) {
    return <p role="status">Anmeldestatus wird geprüft…</p>;
  }

  if (!auth.isAuthenticated) {
    // AC7: nicht angemeldet / Token abgelaufen -> Anmeldeseite statt
    // geschützter Inhalte, keine Daten werden ausgeliefert. Ein
    // `auth.error` (z. B. gescheiterte Discovery/Silent-Renew) wird
    // zusätzlich zur Anmeldeseite angezeigt statt sie zu ersetzen --
    // sonst hätte der Nutzer nach einem fehlgeschlagenen Redirect keinen
    // Retry-Pfad außer einem manuellen Neuladen der Seite.
    return (
      <>
        {auth.error ? <p role="alert">{auth.error.message}</p> : null}
        <LoginPage />
      </>
    );
  }

  return <>{props.children}</>;
}
