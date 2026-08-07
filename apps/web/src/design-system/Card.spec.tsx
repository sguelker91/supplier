/**
 * Rendering-Test für `Card` (React Testing Library), analog
 * `LoginPage.spec.tsx`.
 */
import { render, screen } from '@testing-library/react';

import { Card } from './Card';

describe('Card', () => {
  it('rendert Titel, Aktionen und Inhalt, wenn alle angegeben sind', () => {
    render(
      <Card title="Testtitel" actions={<button type="button">Aktion</button>}>
        <p>Testinhalt</p>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Testtitel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
    expect(screen.getByText('Testinhalt')).toBeInTheDocument();
  });

  it('rendert ausschließlich den Inhalt, wenn weder Titel noch Aktionen angegeben sind', () => {
    render(
      <Card>
        <p>Nur Inhalt</p>
      </Card>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Nur Inhalt')).toBeInTheDocument();
  });
});
