/**
 * Einfache, statische Navigationsleiste (ADR 0009 Abschnitt 1), löst AC3
 * der Story `lieferberechtigungen-anzeigen` ("über dieselbe
 * Navigationsstruktur erreichbar wie andere Portalbereiche, z. B.
 * Kontrakte"). Bewusst KEIN dynamisches Menü-Konfigurationssystem -- eine
 * statische Liste genügt für den heutigen Funktionsumfang.
 *
 * Nutzt `react-router-dom`s `NavLink` für die Aktiv-Kennzeichnung (ADR 0009
 * Abschnitt 2: `react-router-dom` ist neu in `apps/web` entschieden). Die
 * mobile Bottom-Tab-Navigation aus `Design/APP.png` ist ausdrücklich KEINE
 * Vorlage für dieses Web-Layout (eigenständige, seitliche/horizontale
 * Navigationsstruktur für Web).
 */
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import styles from './AppShell.module.css';

export interface AppShellNavigationItem {
  label: string;
  to: string;
}

export interface AppShellProps {
  navigationItems: AppShellNavigationItem[];
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const { navigationItems, children } = props;

  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Hauptnavigation">
        <p className={styles.brand}>Lieferanten-Extranet</p>
        <ul className={styles.navList}>
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
