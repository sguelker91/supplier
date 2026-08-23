/**
 * RN-Äquivalent zu `apps/web/src/design-system/tokens.css` -- React Native
 * kennt keine CSS-Custom-Properties/`oklch()`, daher ein einfaches
 * Plain-TS-Objekt mit denselben Werten (manuell nach sRGB-Hex übersetzt;
 * kann optisch leicht von der Web-Fassung abweichen, bei Gelegenheit
 * gegenprüfen). Beantwortet die in ADR 0009 ("Konsequenzen") offen
 * gelassene Frage, wie die Web-Design-Tokens auf `apps/mobile` übertragen
 * werden -- entschieden direkt hier statt in einer eigenen ADR, siehe
 * `docs/design/web-app-konsistenz-review.md`-Nachfolgeentscheidung.
 */
export const colors = {
  bg: '#f7f6f1',
  surface: '#ffffff',
  accent: '#1c7a4d',
  textPrimary: '#232936',
  textSecondary: '#6b7280',
  textMuted: '#9aa0a6',
  border: '#e5e3de',
  sidebarBg: '#13211a',
  sidebarHover: '#1c2f24',
  inkInverse: '#f5f7ef',
  inkInverseMuted: '#8fa696',
  panelLine: '#33463c',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  card: 16,
  control: 10,
} as const;

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;
