/**
 * App-weiter Support-Kontakt-Footer (ADR 0010, Story
 * `docs/backlog/footer-support-kontakt.md`).
 *
 * Reine, zustandslose Präsentationskomponente ohne Pflicht-Props: Label und
 * Support-Adresse sind bewusst als Konstanten hier hinterlegt (kein
 * Prop-Durchreichen, keine Umgebungsvariable -- konsistent mit dem
 * Nicht-Ziel "keine Konfigurierbarkeit der E-Mail-Adresse" der Backlog-
 * Story). Wird gemäß ADR 0010 genau einmal auf App-Root-Ebene in `App.tsx`
 * eingehängt (Geschwister von `<Routes>` innerhalb von `<BrowserRouter>`),
 * nicht in `AppShell`, damit er unabhängig vom Login-Status auf jeder Seite
 * erscheint.
 */
import styles from './Footer.module.css';

const SUPPORT_LABEL = 'Support-Kontakt:';
const SUPPORT_EMAIL = 'support@myemsland.de';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.label}>{SUPPORT_LABEL}</span>
      <a className={styles.link} href={`mailto:${SUPPORT_EMAIL}`}>
        {SUPPORT_EMAIL}
      </a>
    </footer>
  );
}
