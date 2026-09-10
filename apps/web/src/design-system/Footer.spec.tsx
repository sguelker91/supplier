/**
 * Rendering-Test für `Footer` (React Testing Library), analog `Card.spec.tsx`.
 * Deckt AC9 der Story `footer-support-kontakt` ab: der Footer wird gerendert
 * und enthält die Support-Adresse als `mailto:`-Link.
 */
import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

describe('Footer', () => {
  it('rendert den Footer mit der Support-Adresse als mailto-Link', () => {
    render(<Footer />);

    const link = screen.getByRole('link', { name: 'support@myemsland.de' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'mailto:support@myemsland.de');
  });

  it('rendert den Footer als contentinfo-Landmark mit Label-Text', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('Support-Kontakt:')).toBeInTheDocument();
  });
});
