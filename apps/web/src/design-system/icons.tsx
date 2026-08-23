/**
 * Handgezeichnete, strichbasierte Inline-SVG-Icons für die Sidebar-
 * Navigation (Design-Canvas "Extranet Modern Minimal"). Bewusst keine
 * Icon-Font-/Icon-Bibliothek für zwei Icons -- siehe
 * docs/design/web-app-konsistenz-review.md-Nachfolgeentscheidung.
 */
export function DocumentIcon(props: { size?: number }) {
  const { size = 18 } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 13h6M10 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function TruckIcon(props: { size?: number }) {
  const { size = 18 } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 12h3.2L20 15v2h-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="8" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="19" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function BrandMarkIcon(props: { size?: number; color?: string }) {
  const { size = 24, color = 'currentColor' } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20 L4 12 C4 8 7 5 12 5 C17 5 20 8 20 12 L20 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M4 20 L20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 5 L12 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
