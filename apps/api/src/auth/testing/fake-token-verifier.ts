/**
 * TEST-DOUBLE, NICHT für Produktivbetrieb bestimmt.
 *
 * Gemäß ADR 0006 Punkt 3 laufen Auth-Tests in CI NIEMALS gegen die echte
 * ZITADEL-Cloud-Instanz, sondern gegen eine Test-/Fake-Implementierung des
 * `TokenVerifier`-Interfaces, die selbst-signierte Test-Tokens mit einem im
 * Testprozess erzeugten Schlüsselpaar verifiziert. Diese Klasse ist genau
 * diese Implementierung: Sie erzeugt intern ein Test-Schlüsselpaar, kann
 * damit signierte Test-JWTs ausstellen (`issueTestToken`) und verifiziert
 * ausschließlich gegen dieses lokale Schlüsselpaar -- kein Netzwerkzugriff,
 * kein Bezug zu einer echten ZITADEL-Instanz.
 *
 * Niemals in `AuthModule` (Produktiv-Provider) verdrahten -- ausschließlich
 * in Tests über `overrideProvider(TOKEN_VERIFIER)` einsetzen.
 */

import { generateKeyPair, jwtVerify, SignJWT } from 'jose';
import type { KeyLike } from 'jose';

import { TokenVerificationError, type TokenVerifier } from '../token-verifier.interface';
import { parseSupplierUserType } from '../user-type';
import type { RawZitadelTokenPayload, VerifiedTokenClaims } from '../zitadel-token.types';

export class FakeTokenVerifier implements TokenVerifier {
  private constructor(
    private readonly privateKey: KeyLike,
    private readonly publicKey: KeyLike,
  ) {}

  static async create(): Promise<FakeTokenVerifier> {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    return new FakeTokenVerifier(privateKey, publicKey);
  }

  /** Stellt ein selbst-signiertes Test-JWT mit den übergebenen Claims aus. */
  async issueTestToken(claims: Omit<RawZitadelTokenPayload, 'iat'>): Promise<string> {
    return new SignJWT({ ...claims })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .sign(this.privateKey);
  }

  async verify(rawToken: string): Promise<VerifiedTokenClaims> {
    let payload: RawZitadelTokenPayload;
    try {
      const result = await jwtVerify(rawToken, this.publicKey);
      payload = result.payload as unknown as RawZitadelTokenPayload;
    } catch (error) {
      throw new TokenVerificationError(
        `Test-Token-Verifikation fehlgeschlagen: ${(error as Error).message}`,
        'malformed_token',
      );
    }

    // ADR 0008: dieser Organization-Claim trägt fachlich die GPA.
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
      userType: parseSupplierUserType(payload.user_type),
    };
  }
}
