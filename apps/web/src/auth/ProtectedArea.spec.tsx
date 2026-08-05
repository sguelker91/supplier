/**
 * Test für den Redirect-/Schutzmechanismus geschützter Bereiche (AC7).
 * `react-oidc-context` wird gemockt.
 */
import { render, screen } from '@testing-library/react';

import { ProtectedArea } from './ProtectedArea';

const useAuthMock = jest.fn();

jest.mock('react-oidc-context', () => ({
  useAuth: () => useAuthMock(),
}));

const PROTECTED_CONTENT_TEXT = 'Geschützter Inhalt (synthetisch)';

describe('ProtectedArea (AC7)', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('zeigt einen Ladehinweis, solange der Anmeldestatus noch geprüft wird', () => {
    useAuthMock.mockReturnValue({ isLoading: true, isAuthenticated: false });

    render(
      <ProtectedArea>
        <p>{PROTECTED_CONTENT_TEXT}</p>
      </ProtectedArea>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).not.toBeInTheDocument();
  });

  it('zeigt die Anmeldeseite statt geschützter Inhalte, wenn niemand angemeldet ist', () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      signinRedirect: jest.fn(),
    });

    render(
      <ProtectedArea>
        <p>{PROTECTED_CONTENT_TEXT}</p>
      </ProtectedArea>,
    );

    expect(screen.getByRole('heading', { name: 'Anmeldung' })).toBeInTheDocument();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).not.toBeInTheDocument();
  });

  it('zeigt einen Fehlerhinweis UND die Anmeldeseite (mit Retry-Möglichkeit), wenn die Anmeldeprüfung fehlschlägt', () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('synthetic-protected-area-error'),
      signinRedirect: jest.fn(),
    });

    render(
      <ProtectedArea>
        <p>{PROTECTED_CONTENT_TEXT}</p>
      </ProtectedArea>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('synthetic-protected-area-error');
    // Kein Sackgassen-Zustand: die Anmeldeseite mit "Anmelden"-Button
    // bleibt trotz Fehler sichtbar, damit ein Retry ohne Neuladen der
    // Seite möglich ist.
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).not.toBeInTheDocument();
  });

  it('zeigt die geschützten Inhalte für angemeldete Nutzer', () => {
    useAuthMock.mockReturnValue({ isLoading: false, isAuthenticated: true });

    render(
      <ProtectedArea>
        <p>{PROTECTED_CONTENT_TEXT}</p>
      </ProtectedArea>,
    );

    expect(screen.getByText(PROTECTED_CONTENT_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Anmeldung' })).not.toBeInTheDocument();
  });
});
