/**
 * Rendering-Test für `LoginPage` (React Testing Library).
 * Ausschließlich synthetische Testdaten (CLAUDE.md, "Sensible Daten").
 *
 * Deckt AC6 der Story `lieferanten-anmeldung-gpa` ab (kein Self-Signup)
 * sowie den Login-Auslöse-Mechanismus (`loginWithZitadel` wird mit der
 * übergebenen Konfiguration aufgerufen).
 */
import { fireEvent, render, screen } from '@testing-library/react';

import { LoginPage } from './LoginPage';
import type { OidcClientConfig } from './oidc-config.types';

const SYNTHETIC_CONFIG: OidcClientConfig = {
  issuer: 'https://synthetic-test-issuer.example',
  clientId: 'synthetic-test-client-id',
  redirectUri: 'https://synthetic-test.example/auth/callback',
  scopes: ['openid'],
};

describe('LoginPage', () => {
  it('zeigt eine Anmelden-Aktion, aber keine Registrierungs-/Sign-up-Option (AC6)', () => {
    render(<LoginPage config={SYNTHETIC_CONFIG} />);

    expect(screen.getByRole('heading', { name: 'Anmeldung' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.queryByText(/registrieren/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/konto anlegen/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('löst beim Klick den OIDC-Login-Versuch gegen ZITADEL aus', async () => {
    render(<LoginPage config={SYNTHETIC_CONFIG} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    // `loginWithZitadel` schlägt aktuell bewusst immer fehl, solange kein
    // echtes OIDC-SDK integriert ist (siehe auth-client.ts) -- der Fehler
    // muss sichtbar gemacht werden, statt den Nutzer im Unklaren zu lassen.
    expect(await screen.findByRole('alert')).toHaveTextContent(/loginWithZitadel/i);
  });

  it('meldet einen fehlgeschlagenen Login-Versuch über onLoginError', async () => {
    const onLoginError = jest.fn();
    render(<LoginPage config={SYNTHETIC_CONFIG} onLoginError={onLoginError} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

    await screen.findByRole('alert');
    expect(onLoginError).toHaveBeenCalledTimes(1);
  });
});
