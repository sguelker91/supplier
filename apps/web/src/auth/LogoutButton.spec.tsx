/**
 * Test für die aktive Abmeldung (AC9). `react-oidc-context` wird gemockt --
 * kein echter Netzwerkaufruf gegen den ZITADEL End-Session-Endpoint in
 * Tests.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LogoutButton } from './LogoutButton';

const signoutRedirectMock = jest.fn();
const useAuthMock = jest.fn();

jest.mock('react-oidc-context', () => ({
  useAuth: () => useAuthMock(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    signoutRedirectMock.mockReset();
    useAuthMock.mockReset();
  });

  it('zeigt keine Abmelden-Aktion für nicht angemeldete Nutzer', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, signoutRedirect: signoutRedirectMock });

    render(<LogoutButton />);

    expect(screen.queryByRole('button', { name: 'Abmelden' })).not.toBeInTheDocument();
  });

  it('beendet bei Klick die Sitzung über den ZITADEL End-Session-Endpoint (AC9)', async () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, signoutRedirect: signoutRedirectMock });

    render(<LogoutButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Abmelden' }));

    await waitFor(() => expect(signoutRedirectMock).toHaveBeenCalledTimes(1));
  });
});
