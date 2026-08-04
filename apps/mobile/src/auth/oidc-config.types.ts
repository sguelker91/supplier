/**
 * BEWUSST WEITERHIN PLATZHALTER: kein echtes OIDC-SDK eingebunden (siehe
 * `auth-client.ts`). Läuft als echter TypeScript-Code im Expo-Projekt.
 *
 * Bildet die Konfiguration ab, die laut ADR 0004
 * ("ZITADEL Cloud als OIDC-Identity-Provider für
 * Lieferanten-Authentifizierung") Punkt 1/2 für den Authorization-Code-
 * Flow mit PKCE gegen ZITADEL Cloud auf Mobile benötigt wird. ADR 0004
 * Punkt 1 verlangt für `apps/mobile` denselben Flow-Typ (Authorization
 * Code Flow + PKCE) wie für `apps/web`, da beide Public Clients sind.
 *
 * Die konkrete Client-Bibliothek ist laut ADR 0004 ("Konsequenzen")
 * offen; naheliegender Kandidat für Expo ist `expo-auth-session`
 * (unterstützt PKCE nativ), aber NICHT real integriert — kein
 * `package.json`, keine Expo-Dependency vorhanden (ADR 0003, "Offene
 * technische Entscheidungen").
 *
 * ADR: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 */
export interface OidcClientConfig {
  /** ZITADEL-Instanz-URL dieses Projekts, z. B. https://<instanz>.zitadel.cloud */
  issuer: string;
  /** Public-Client-ID der `apps/mobile`-Applikation in ZITADEL. */
  clientId: string;
  /**
   * Bei Mobile typischerweise ein Custom-URI-Scheme oder Expo-spezifisches
   * Redirect-Schema (z. B. via `expo-auth-session`s `makeRedirectUri`),
   * nicht eine HTTPS-Web-Redirect-URI. Konkreter Wert ist
   * App-/ZITADEL-Konfigurationsdetail, nicht Teil der ADR.
   */
  redirectUri: string;
  /** OIDC-Scopes; mindestens `openid`. Siehe offene Annahme in ADR 0004. */
  scopes: string[];
}
