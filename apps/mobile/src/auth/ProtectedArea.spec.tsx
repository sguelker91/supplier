/**
 * Test für den Schutzmechanismus geschützter Bereiche (AC7).
 * `ZitadelAuthProvider`s `useAuth` wird gemockt.
 */
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ProtectedArea } from './ProtectedArea';

const mockUseAuth = jest.fn();

jest.mock('./ZitadelAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

const PROTECTED_CONTENT_TEXT = 'Geschützter Inhalt (synthetisch)';

describe('ProtectedArea (AC7)', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('zeigt einen Ladehinweis, solange der Anmeldestatus noch geprüft wird', async () => {
    mockUseAuth.mockReturnValue({ isLoading: true, isAuthenticated: false });

    await render(
      <ProtectedArea>
        <Text>{PROTECTED_CONTENT_TEXT}</Text>
      </ProtectedArea>,
    );

    expect(screen.getByText('Anmeldestatus wird geprüft…')).toBeTruthy();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).toBeNull();
  });

  it('zeigt den Login-Screen statt geschützter Inhalte, wenn niemand angemeldet ist', async () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: false, login: jest.fn() });

    await render(
      <ProtectedArea>
        <Text>{PROTECTED_CONTENT_TEXT}</Text>
      </ProtectedArea>,
    );

    expect(screen.getByText('Anmeldung')).toBeTruthy();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).toBeNull();
  });

  it('zeigt einen Fehlerhinweis UND den Login-Screen (mit Retry-Möglichkeit), wenn die Anmeldeprüfung fehlschlägt', async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      error: new Error('synthetic-protected-area-error'),
      login: jest.fn(),
    });

    await render(
      <ProtectedArea>
        <Text>{PROTECTED_CONTENT_TEXT}</Text>
      </ProtectedArea>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('synthetic-protected-area-error');
    expect(screen.getByRole('button', { name: 'Anmelden' })).toBeTruthy();
    expect(screen.queryByText(PROTECTED_CONTENT_TEXT)).toBeNull();
  });

  it('zeigt die geschützten Inhalte für angemeldete Nutzer', async () => {
    mockUseAuth.mockReturnValue({ isLoading: false, isAuthenticated: true });

    await render(
      <ProtectedArea>
        <Text>{PROTECTED_CONTENT_TEXT}</Text>
      </ProtectedArea>,
    );

    expect(screen.getByText(PROTECTED_CONTENT_TEXT)).toBeTruthy();
    expect(screen.queryByText('Anmeldung')).toBeNull();
  });
});
