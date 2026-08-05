/**
 * Test für die aktive Abmeldung (AC9). `ZitadelAuthProvider`s `useAuth`
 * wird gemockt -- kein echter Netzwerkaufruf gegen ZITADEL in Tests.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LogoutButton } from './LogoutButton';

const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('./ZitadelAuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockUseAuth.mockReset();
  });

  it('zeigt keine Abmelden-Aktion für nicht angemeldete Nutzer', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, logout: mockLogout });

    await render(<LogoutButton />);

    expect(screen.queryByRole('button', { name: 'Abmelden' })).toBeNull();
  });

  it('beendet bei Tippen die lokal gespeicherte Sitzung (AC9)', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, logout: mockLogout });

    await render(<LogoutButton />);
    fireEvent.press(screen.getByRole('button', { name: 'Abmelden' }));

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  });
});
