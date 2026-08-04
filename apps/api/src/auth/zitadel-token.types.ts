/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code.
 *
 * Bildet den Token-Vertrag ab, den ADR 0004 ("ZITADEL Cloud als
 * OIDC-Identity-Provider für Lieferanten-Authentifizierung") Punkt 2/3 für
 * das von ZITADEL ausgestellte, signierte ID-/Access-Token voraussetzt.
 *
 * Story-Kontext: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 * ADR 0002 (Mandantentrennung): docs/architecture/adr/0002-mandantentrennung-kontrakte.md
 */

/**
 * Rohe, noch UNVERIFIZIERTE Token-Claims, wie sie strukturell in einem von
 * ZITADEL Cloud ausgestellten JWT erwartet werden (Standard-OIDC-Claims
 * plus Organization-Zugehörigkeit).
 *
 * WICHTIG (offenes Detail, siehe ADR 0004 Punkt 3 / "Offene Annahmen"): Der
 * exakte Claim-Name, unter dem ZITADEL die Organization-Zugehörigkeit im
 * Token mitführt, ist projekt-/konfigurationsabhängig (abhängig von der
 * konkreten ZITADEL-Projekt-/Actions-/Custom-Claims-Konfiguration, die laut
 * ADR 0004 noch nicht spezifiziert ist). Dieses Interface listet die
 * plausibelsten Varianten als Platzhalter auf; welche davon tatsächlich
 * zutrifft, muss beim realen ZITADEL-Projekt-Setup verifiziert werden.
 */
export interface RawZitadelTokenPayload {
  /** Standard-OIDC: Subject, eindeutige ZITADEL-Nutzer-ID. */
  sub: string;
  /** Standard-OIDC: ausstellende ZITADEL-Instanz-URL. */
  iss: string;
  /** Standard-OIDC: erwartete Audience (Client-ID der jeweiligen App). */
  aud: string | string[];
  /** Standard-OIDC: Ablaufzeit (Unix-Timestamp, Sekunden). */
  exp: number;
  /** Standard-OIDC: Ausstellungszeit (Unix-Timestamp, Sekunden). */
  iat: number;
  email?: string;
  email_verified?: boolean;
  /**
   * PLATZHALTER: möglicher Custom-Claim für die ZITADEL-Organization-ID.
   * Name/Vorhandensein hängt von der ZITADEL-Projektkonfiguration ab
   * (siehe ADR 0004 "Offene Annahmen").
   */
  org_id?: string;
  /**
   * PLATZHALTER: alternative, ZITADEL-eigene URN-Claim-Form für die
   * "Resource Owner"-Organisation eines Nutzers.
   */
  'urn:zitadel:iam:user:resourceowner:id'?: string;
}

/**
 * Normalisierte Claims NACH erfolgreicher kryptographischer
 * Signaturprüfung durch einen `TokenVerifier` (siehe
 * `token-verifier.interface.ts`), aber VOR der fachlichen Claims-Policy-
 * Prüfung (Ablaufzeit/Issuer/Audience), die laut ADR 0004 bewusst getrennt
 * in `AuthGuardService` erfolgt.
 */
export interface VerifiedTokenClaims {
  subject: string;
  issuer: string;
  audience: string | string[];
  /** Unix-Timestamp (Sekunden). */
  expiresAt: number;
  /** Unix-Timestamp (Sekunden). */
  issuedAt: number;
  email?: string;
  /**
   * Aus einem der in `RawZitadelTokenPayload` genannten
   * Organization-Claims extrahiert. `null`, wenn das Token keinen
   * Organization-Claim enthält — `AuthGuardService` behandelt das als
   * expliziten Fehlerfall, nicht als stillen Fallback (siehe ADR 0004
   * Punkt 3, "Herkunftsgarantie" für `supplierId`).
   */
  organizationId: string | null;
}
