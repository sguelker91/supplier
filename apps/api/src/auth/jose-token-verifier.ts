/**
 * Echte `TokenVerifier`-Implementierung (siehe `token-verifier.interface.ts`)
 * auf Basis von `jose`, wie in ADR 0004 Punkt 2 und in der bisherigen
 * Implementierungsnotiz von `token-verifier.interface.ts` als künftiger
 * Weg beschrieben ("nutzt z. B. `jose` ... gegen den ZITADEL-JWKS-Endpoint").
 *
 * Verifiziert ausschließlich Signatur/Struktur des JWT gegen den
 * öffentlichen JWKS-Endpoint der konfigurierten ZITADEL-Instanz. Ablaufzeit
 * (`exp`), Issuer (`iss`) und Audience (`aud`) werden gemäß der bewussten
 * Trennung in ADR 0004 zusätzlich (und primär fachlich) in
 * `AuthGuardService` geprüft -- `jose` validiert `exp`/`nbf` als Teil der
 * Standard-JWT-Verifikation stets mit (kann bei `jwtVerify` nicht
 * abgeschaltet werden); das ist unschädliche Doppelprüfung, keine
 * Umgehung der in ADR 0004 beschriebenen Trennung von Kryptographie und
 * fachlicher Claims-Policy.
 *
 * Versionshinweis (Umsetzungsdetail, keine ADR-Frage): `jose` wird in
 * Version 5.x eingebunden, NICHT 6.x. `jose@6` ist ESM-only (kein
 * `require`-Export-Condition mehr), was mit dem hier gewählten NestJS-
 * Standard-Build (CommonJS, siehe `tsconfig.json`/`nest-cli.json`) sowohl
 * zur Laufzeit (`node dist/main.js` würde mit `ERR_REQUIRE_ESM` scheitern)
 * als auch mit `ts-jest`s CommonJS-Transform kollidiert. `jose@5` bietet
 * weiterhin einen `require`-Export-Pfad (Dual-Package) und ist damit die
 * unstrittige Wahl, solange keine ADR eine projektweite Umstellung auf
 * natives ESM für `apps/api` trifft.
 */

import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';

import {
  TokenVerificationError,
  type TokenVerificationFailureReason,
  type TokenVerifier,
} from './token-verifier.interface';
import type { RawZitadelTokenPayload, VerifiedTokenClaims } from './zitadel-token.types';

export class JoseTokenVerifier implements TokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(jwksUri: string) {
    this.jwks = createRemoteJWKSet(new URL(jwksUri));
  }

  async verify(rawToken: string): Promise<VerifiedTokenClaims> {
    let payload: RawZitadelTokenPayload;

    try {
      const result = await jwtVerify(rawToken, this.jwks);
      payload = result.payload as unknown as RawZitadelTokenPayload;
    } catch (error) {
      throw new TokenVerificationError(
        `JWT-Signaturprüfung fehlgeschlagen: ${(error as Error).message}`,
        this.mapFailureReason(error),
      );
    }

    return this.toVerifiedClaims(payload);
  }

  private mapFailureReason(error: unknown): TokenVerificationFailureReason {
    if (error instanceof joseErrors.JWKSNoMatchingKey || error instanceof joseErrors.JWKSTimeout) {
      return 'jwks_unavailable';
    }
    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      return 'invalid_signature';
    }
    return 'malformed_token';
  }

  private toVerifiedClaims(payload: RawZitadelTokenPayload): VerifiedTokenClaims {
    const organizationId =
      payload.org_id ?? payload['urn:zitadel:iam:user:resourceowner:id'] ?? null;

    return {
      subject: payload.sub,
      issuer: payload.iss,
      audience: payload.aud,
      expiresAt: payload.exp,
      issuedAt: payload.iat,
      email: payload.email,
      organizationId,
    };
  }
}
