/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, keine echte
 * JWKS-Bibliothek eingebunden.
 *
 * Repräsentiert die kryptographische Verifikation eines von ZITADEL Cloud
 * ausgestellten JWT gegen den öffentlichen JWKS-Endpoint der
 * ZITADEL-Instanz (ADR 0004 Punkt 2: "apps/api verifiziert jedes
 * eingehende Token serverseitig gegen den öffentlichen JWKS-Endpoint").
 *
 * ECHTE IMPLEMENTIERUNG (bewusst NICHT Teil dieses Konturwurfs, siehe
 * ADR 0003 "Offene technische Entscheidungen" — kein Paketmanager/
 * Dependency-Setup vorhanden): nutzt z. B. `jose` oder `jwks-rsa` gegen den
 * ZITADEL-JWKS-Endpoint (üblicherweise `<issuer>/oauth/v2/keys`), sobald
 * ein Paketmanager/Dependency-Setup entschieden ist. Eine echte
 * Implementierung würde:
 * 1. den `kid`-Header des JWT lesen und den passenden öffentlichen
 *    Schlüssel vom (gecachten) JWKS-Endpoint der konfigurierten
 *    ZITADEL-Issuer-URL laden,
 * 2. die Signatur des JWT gegen diesen Schlüssel prüfen,
 * 3. bei Erfolg die Claims in normalisierter Form (`VerifiedTokenClaims`)
 *    zurückgeben.
 */

import type { VerifiedTokenClaims } from './zitadel-token.types';

/** Fehlerfälle der reinen Signaturprüfung (NICHT der Claims-Policy). */
export type TokenVerificationFailureReason =
  | 'invalid_signature'
  | 'malformed_token'
  | 'jwks_unavailable';

/**
 * Definierter Fehlerfall bei fehlgeschlagener Tokenverifikation. Es gibt
 * bewusst KEINEN stillen Fallback (z. B. auf ein "anonymes" oder
 * "Default"-Supplier-Ergebnis) — jeder Verifikationsfehler muss den
 * Request serverseitig ablehnen.
 */
export class TokenVerificationError extends Error {
  constructor(
    message: string,
    public readonly reason: TokenVerificationFailureReason,
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

export interface TokenVerifier {
  /**
   * Prüft die kryptographische Signatur des übergebenen JWT gegen den
   * ZITADEL-JWKS-Endpoint und liefert die normalisierten Claims.
   *
   * Prüft laut ADR 0004 AUSSCHLIESSLICH die Signatur/Struktur — Ablaufzeit
   * (`exp`), Issuer (`iss`) und Audience (`aud`) werden bewusst NICHT hier,
   * sondern separat in `AuthGuardService` geprüft, um kryptographische
   * Verifikation und fachliche Claims-Policy klar zu trennen.
   *
   * @throws {TokenVerificationError} bei ungültiger Signatur, strukturell
   *   fehlerhaftem Token oder nicht erreichbarem JWKS-Endpoint. Niemals ein
   *   stiller Fallback-Wert.
   */
  verify(rawToken: string): Promise<VerifiedTokenClaims>;
}
