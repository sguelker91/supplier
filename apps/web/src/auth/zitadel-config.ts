/**
 * Reale ZITADEL-Projekt-/Applikationskonfiguration für `apps/web`, wie in
 * den Implementierungsnotizen von
 * `docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md`
 * dokumentiert:
 *
 * - Instanz/Issuer (Region `eu1`): https://supplier-janwkz.eu1.zitadel.cloud
 * - ZITADEL-Projekt-ID: 384797730033190919
 * - Applikation "Web" (`apps/web`): OIDC-Client-ID 384798128626288647
 *   (Public Client mit PKCE, ADR 0004 Punkt 1 -- KEIN Client-Secret).
 *
 * Diese Werte sind reine Konfiguration (keine ADR-Entscheidung selbst) und
 * wurden bislang nur in der ADR dokumentiert, nicht im Code verwendet. Mit
 * der echten OIDC-Client-SDK-Integration (`oidc-client-ts`/
 * `react-oidc-context`, siehe `apps/web/package.json`) ziehen sie hier
 * erstmals in lauffähigen Code ein.
 *
 * Bewusst nicht über Umgebungsvariablen (`.env`) konfigurierbar gemacht:
 * Für `apps/web` existiert noch kein entschiedenes Env-/Secrets-Konzept
 * (ADR 0004 nennt das explizit als offen: "gehören perspektivisch in eine
 * Umgebungskonfiguration ... sobald ein Framework/Dependency-Setup
 * existiert"). Da es sich um öffentliche, nicht-geheime Kennungen handelt
 * (Public Client), ist ein Klartext-Konstantenwert hier kein
 * Sicherheitsproblem -- lediglich unflexibel für mehrere Umgebungen
 * (z. B. Staging vs. Produktion), was als offener Punkt dokumentiert wird
 * (siehe Implementierungsnotiz im Backlog).
 */
import type { AuthProviderNoUserManagerProps } from 'react-oidc-context';

/** ZITADEL-Instanz-URL dieses Projekts (Region eu1). */
export const ZITADEL_ISSUER = 'https://supplier-janwkz.eu1.zitadel.cloud';

/** Public-Client-ID der `apps/web`-Applikation in ZITADEL (nicht geheim). */
export const ZITADEL_WEB_CLIENT_ID = '384798128626288647';

/**
 * Pfad, unter dem `apps/web` den OIDC-Redirect-Callback entgegennimmt (muss
 * exakt der in der ZITADEL-Applikation hinterlegten Redirect-URI
 * entsprechen, siehe `AuthCallbackPage.tsx` und `App.tsx`).
 */
export const AUTH_CALLBACK_PATH = '/auth/callback';

/**
 * Baut die `AuthProvider`-Konfiguration (react-oidc-context) für den
 * Authorization-Code-Flow mit PKCE gegen ZITADEL auf.
 *
 * `origin` ist injizierbar (statt hart `window.location.origin` zu lesen),
 * damit Redirect-/Post-Logout-URIs pro Umgebung (lokal, Staging, Produktion)
 * korrekt aus der tatsächlichen Herkunfts-URL abgeleitet werden, ohne dass
 * diese Datei selbst wissen muss, unter welcher Domain sie läuft --
 * gleichzeitig bleibt die Funktion dadurch ohne DOM einfach testbar.
 */
export function createZitadelAuthProviderProps(
  origin: string = window.location.origin,
): AuthProviderNoUserManagerProps {
  return {
    authority: ZITADEL_ISSUER,
    client_id: ZITADEL_WEB_CLIENT_ID,
    redirect_uri: `${origin}${AUTH_CALLBACK_PATH}`,
    post_logout_redirect_uri: origin,
    // Authorization Code Flow -- oidc-client-ts aktiviert PKCE dafür
    // standardmäßig (`disablePKCE: false`), passend zu ADR 0004 Punkt 1/2
    // und dem Public-Client-Charakter dieser Applikation (kein
    // Client-Secret vorhanden/nötig).
    response_type: 'code',
    // Mindestens `openid` (ID-Token) sowie Standard-Profilangaben. Welcher
    // zusätzliche Scope für den GPA-tragenden Organization-Claim nötig ist,
    // bleibt laut ADR 0004/0008 offen (siehe Implementierungsnotiz) -- wird
    // hier bewusst NICHT spekulativ ergänzt.
    scope: 'openid profile email',
    // Token-Ablage: bewusst KEIN eigener `userStore`. oidc-client-ts nutzt
    // ohne explizite Konfiguration standardmäßig einen
    // `WebStorageStateStore` auf Basis von `window.sessionStorage` (siehe
    // Implementierungsnotiz in docs/backlog/lieferanten-anmeldung-gpa.md).
    // Das ist bewusst gewählt statt `localStorage` (verschwindet beim
    // Schließen des Tabs/Browsers, tab-gebunden, kein dauerhaft über
    // mehrere Browser-Sitzungen abrufbares Rohtoken) und bewusst ohne
    // eigene In-Memory-Implementierung (weniger Eigencode = weniger
    // Fehlerfläche für einen sicherheitskritischen Mechanismus).
    // Silent Renew ist bewusst NICHT aktiviert (`automaticSilentRenew`
    // bleibt auf dem Default `false`): Token-Lebensdauer und
    // Refresh-Strategie sind laut ADR 0004 "Konsequenzen" weiterhin offen;
    // eine eigene Festlegung würde diese offene Architekturfrage im
    // Alleingang beantworten.
    onSigninCallback: () => {
      // Entfernt `code`/`state` aus der sichtbaren URL nach dem
      // Code-Austausch (Standard-Empfehlung von react-oidc-context), ohne
      // bereits selbst zur Startseite zu navigieren -- das übernimmt
      // `AuthCallbackPage`, sobald `isAuthenticated` sicher feststeht.
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };
}
