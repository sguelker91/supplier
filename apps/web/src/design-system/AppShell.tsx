/**
 * Linke Sidebar-Navigation (Design-Canvas "Extranet Modern Minimal", löst
 * weiterhin AC3 der Story `lieferberechtigungen-anzeigen` --
 * "über dieselbe Navigationsstruktur erreichbar wie andere Portalbereiche,
 * z. B. Kontrakte"). War ursprünglich (ADR 0009 Abschnitt 1) eine
 * horizontale Top-Bar; seit der "Modern Minimal"-Überarbeitung eine
 * vertikale, dunkle Sidebar. Bewusst weiterhin KEIN dynamisches
 * Menü-Konfigurationssystem -- eine statische Liste genügt für den
 * heutigen Funktionsumfang.
 *
 * Nutzt `react-router-dom`s `NavLink` für die Aktiv-Kennzeichnung (ADR 0009
 * Abschnitt 2). Die mobile Bottom-Tab-Navigation aus `Design/APP.png`/dem
 * "Extranet Mobile Modern"-Canvas ist eine eigenständige Umsetzung für
 * `apps/mobile`, kein Vorbild für dieses Web-Layout.
 *
 * Absichtlich nur die zwei heute echten Bereiche (Kontrakte,
 * Lieferberechtigungen) -- keine Nav-Einträge für im Design-Mockup
 * gezeigte, aber noch nicht gebaute Bereiche (Abnahmescheine, Belege,
 * Mengenmeldung, Abfragen) vortäuschen.
 *
 * Kein Nutzer-Identitätsblock am Sidebar-Ende (Avatar/Name/Firma) --
 * `apps/web` hat aktuell keine echten Profildaten; ein erfundener
 * Platzhalter wäre irreführende Produktions-UI. TODO: ergänzen, sobald
 * eine Profil-/Nutzerdaten-Story existiert.
 */
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import styles from './AppShell.module.css';
import { BrandMarkIcon } from './icons';

export interface AppShellNavigationItem {
  label: string;
  to: string;
  icon?: ReactNode;
}

export interface AppShellProps {
  navigationItems: AppShellNavigationItem[];
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const { navigationItems, children } = props;

  return (
    <div className={styles.shell}>
      <nav className={styles.sidebar} aria-label="Hauptnavigation">
        <div className={styles.brand}>
          <BrandMarkIcon size={22} />
          <span>Lieferanten-Extranet</span>
        </div>
        <ul className={styles.navList}>
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                }
              >
                {item.icon}
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
