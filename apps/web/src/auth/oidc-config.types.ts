/**
 * BEWUSST WEITERHIN PLATZHALTER: kein echtes OIDC-SDK eingebunden (siehe
 * `auth-client.ts`). Läuft als echter TypeScript-Code im React+Vite-Projekt.
 *
 * Bildet die Konfiguration ab, die laut ADR 0004
 * ("ZITADEL Cloud als OIDC-Identity-Provider für
 * Lieferanten-Authentifizierung") Punkt 1/2 für den Authorization-Code-
 * Flow mit PKCE gegen ZITADEL Cloud benötigt wird. Die konkrete
 * Client-Bibliothek (z. B. `oidc-client-ts`, `react-oidc-context`) ist
 * laut ADR 0004 ("Konsequenzen": "konkrete Bibliothekswahl ... wird NICHT
 * in dieser ADR getroffen") noch offen — dieser Konturwurf bildet nur die
 * Schnittstelle ab, kein echtes SDK.
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 */
export interface OidcClientConfig {
  /** ZITADEL-Instanz-URL dieses Projekts, z. B. https://<instanz>.zitadel.cloud */
  issuer: string;
  /** Public-Client-ID der `apps/web`-Applikation in ZITADEL (Konfigurationsdetail, nicht Teil der ADR). */
  clientId: string;
  /**
   * Muss exakt der in der ZITADEL-Applikation hinterlegten Redirect-URI
   * entsprechen. Konkreter Wert ist Deployment-/Umgebungskonfiguration.
   */
  redirectUri: string;
  /**
   * OIDC-Scopes; mindestens `openid`. Ob/welcher zusätzliche Scope für
   * den Organization-Claim benötigt wird, ist laut ADR 0004 ("Offene
   * Annahmen") noch nicht spezifiziert.
   */
  scopes: string[];
}
