/**
 * Rendering-Test für `AppShell` (AC3: gemeinsame Navigationsstruktur).
 * `NavLink` benötigt einen Router-Kontext -- daher `MemoryRouter`.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('rendert alle Navigationseinträge sowie den Inhalt (AC3)', () => {
    render(
      <MemoryRouter initialEntries={['/contracts']}>
        <AppShell
          navigationItems={[
            { label: 'Kontrakte', to: '/contracts' },
            { label: 'Lieferberechtigungen', to: '/delivery-authorizations' },
          ]}
        >
          <p>Seiteninhalt</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Kontrakte' })).toHaveAttribute('href', '/contracts');
    expect(screen.getByRole('link', { name: 'Lieferberechtigungen' })).toHaveAttribute(
      'href',
      '/delivery-authorizations',
    );
    expect(screen.getByText('Seiteninhalt')).toBeInTheDocument();
  });

  it('kennzeichnet den aktiven Navigationseintrag', () => {
    render(
      <MemoryRouter initialEntries={['/delivery-authorizations']}>
        <AppShell
          navigationItems={[
            { label: 'Kontrakte', to: '/contracts' },
            { label: 'Lieferberechtigungen', to: '/delivery-authorizations' },
          ]}
        >
          <p>Seiteninhalt</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Lieferberechtigungen' })).toHaveClass('navLinkActive');
    expect(screen.getByRole('link', { name: 'Kontrakte' })).not.toHaveClass('navLinkActive');
  });
});
