/**
 * Reale ZITADEL-Projekt-/Applikationskonfiguration für `apps/mobile`,
 * analog zu `apps/web/src/auth/zitadel-config.ts`:
 *
 * - Instanz/Issuer (Region `eu1`, identisch zu Web, siehe
 *   `docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md`):
 *   https://supplier-janwkz.eu1.zitadel.cloud
 * - Applikation "Native" (`apps/mobile`): OIDC-Client-ID
 *   384911280479225863 (Public Client mit PKCE, ADR 0004 Punkt 1 --
 *   KEIN Client-Secret, wie bei der Web-Applikation).
 *
 * Web und Mobile teilen sich dieselbe ZITADEL-Instanz und damit dieselben
 * Nutzerkonten/Organisationen (eine Organization pro GPA, ADR 0008) --
 * eine Anmeldung funktioniert mit denselben Zugangsdaten auf beiden
 * Plattformen. Nur Client-ID und Redirect-Mechanismus unterscheiden sich
 * pro Applikation, wie bei OIDC für mehrere Client-Typen üblich.
 *
 * Wie bei Web ist die Client-ID eine öffentliche, nicht-geheime Kennung
 * (Public Client, PKCE) -- ein Klartext-Konstantenwert ist hier kein
 * Sicherheitsproblem.
 */
export const ZITADEL_ISSUER = 'https://supplier-janwkz.eu1.zitadel.cloud';

/** Public-Client-ID der `apps/mobile`-Applikation ("Native") in ZITADEL. */
export const ZITADEL_MOBILE_CLIENT_ID = '384911280479225863';

/**
 * Custom-URI-Scheme dieser App (siehe `app.json` `expo.scheme`). EAS
 * Build/`expo prebuild` tragen daraus automatisch die nötigen nativen
 * Redirect-Konfigurationen (iOS `CFBundleURLTypes`, Android-Intent-Filter)
 * ein.
 */
export const AUTH_SCHEME = 'supplierextranet';

/** Pfadanteil des Redirects, ergibt `supplierextranet://auth/callback`. */
export const AUTH_REDIRECT_PATH = 'auth/callback';

/**
 * OIDC-Scopes; identisch zu Web. Bewusst KEIN `offline_access` --
 * Token-Lebensdauer/Refresh-Strategie auf Mobile ist laut ADR 0004
 * ("Konsequenzen": "Refresh-Token-Rotation auf Mobile") weiterhin offen
 * und wird hier nicht im Alleingang entschieden.
 */
export const AUTH_SCOPES = ['openid', 'profile', 'email'];
