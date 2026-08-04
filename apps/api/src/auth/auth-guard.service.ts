/**
 * PROTOTYP / KONTURWURF — kein lauffähiger Code, kein Framework.
 *
 * Füllt den in ADR 0002 (`contract.types.ts`) skizzierten
 * `AuthenticatedSupplierContext` erstmals mit einer echten
 * Herkunftsgarantie, wie sie ADR 0004 Punkt 2/3 fordert und der
 * Security-Bericht (`docs/security/lieferant-kontrakte-einsehen.md`,
 * Befund "AuthenticatedSupplierContext ist reines Vertrauenskonstrukt
 * ohne Herkunftsgarantie") als kritischen Mangel benennt:
 * `supplierId` wird HIER ausschließlich aus einem kryptographisch
 * geprüften Claim eines ZITADEL-signierten Tokens abgeleitet — niemals
 * aus einem Client-Header, Pfad-/Query-/Body-Parameter.
 *
 * Was hier bewusst fehlt (kein Framework-Setup, siehe ADR 0003, "Offene
 * technische Entscheidungen"):
 * - Kein `@Injectable()`/NestJS-Guard (`CanActivate`) — sobald das
 *   Framework gesetzt ist, wird `authenticate()` zum Kern eines echten
 *   `ZitadelAuthGuard implements CanActivate`.
 * - Keine echte `TokenVerifier`-Implementierung (siehe
 *   `token-verifier.interface.ts`).
 * - Kein Caching/Refresh der JWKS-Konfiguration.
 *
 * ADRs: docs/architecture/adr/0004-zitadel-oidc-authentifizierung.md
 *       docs/architecture/adr/0002-mandantentrennung-kontrakte.md
 */

import type { AuthenticatedSupplierContext } from '../contracts/contract.types';
import { TokenVerificationError, type TokenVerifier } from './token-verifier.interface';
import type { VerifiedTokenClaims } from './zitadel-token.types';

/** Fehlerfälle der fachlichen Claims-Policy-Prüfung (nach Signaturprüfung). */
export type AuthGuardFailureReason =
  | 'missing_token'
  | 'invalid_or_expired_token'
  | 'issuer_mismatch'
  | 'audience_mismatch'
  | 'missing_organization_claim';

/**
 * Definierter Fehlerfall bei fehlgeschlagener Authentifizierung. Es gibt
 * bewusst KEINEN stillen Fallback (z. B. ein anonymes/"Default"-Supplier-
 * Ergebnis) — jeder Fehlerfall muss den Request serverseitig ablehnen
 * (in einem echten Framework i. d. R. als HTTP 401 gemappt, siehe
 * `contracts.controller.ts`).
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly reason: AuthGuardFailureReason,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface AuthGuardConfig {
  /**
   * Erwarteter Issuer, d. h. die URL der für dieses Projekt konfigurierten
   * ZITADEL-Instanz. Konkreter Wert ist ZITADEL-Projektkonfiguration,
   * nicht Teil von ADR 0004 selbst.
   */
  expectedIssuer: string;
  /**
   * Erwartete Audience, i. d. R. die ZITADEL-Client-ID von `apps/api` bzw.
   * der jeweiligen Applikation. Ebenfalls ZITADEL-Projektkonfiguration.
   */
  expectedAudience: string;
}

/**
 * Fortführung des in ADR 0002 Punkt 3 skizzierten Guard-Musters
 * ("Autorisierungs-Guard validiert den Auth-Kontext"), jetzt mit
 * tatsächlicher Tokenverifikation gemäß ADR 0004.
 */
export class AuthGuardService {
  constructor(
    private readonly tokenVerifier: TokenVerifier,
    private readonly config: AuthGuardConfig,
  ) {}

  /**
   * Verifiziert den `Authorization`-Header eines eingehenden Requests und
   * baut daraus den `AuthenticatedSupplierContext`.
   *
   * @throws {AuthenticationError} bei fehlendem/ungültigem/abgelaufenem
   *   Token oder fehlendem Organization-Claim. Kein stiller Fallback.
   */
  async authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedSupplierContext> {
    const rawToken = this.extractBearerToken(authorizationHeader);
    const claims = await this.verifySignature(rawToken);

    this.assertNotExpired(claims);
    this.assertIssuerMatches(claims);
    this.assertAudienceMatches(claims);

    return this.toSupplierContext(claims);
  }

  private extractBearerToken(header: string | undefined): string {
    if (!header || !header.startsWith('Bearer ')) {
      throw new AuthenticationError(
        'Kein Bearer-Token im Authorization-Header vorhanden.',
        'missing_token',
      );
    }
    return header.slice('Bearer '.length).trim();
  }

  private async verifySignature(rawToken: string): Promise<VerifiedTokenClaims> {
    try {
      return await this.tokenVerifier.verify(rawToken);
    } catch (error) {
      if (error instanceof TokenVerificationError) {
        throw new AuthenticationError(
          `Tokenverifikation fehlgeschlagen: ${error.message}`,
          'invalid_or_expired_token',
        );
      }
      throw error;
    }
  }

  /**
   * Ablaufzeit-Prüfung (Platzhalter-Prüfung im Sinne der Aufgabenstellung
   * — eine echte JWT-Bibliothek würde `exp` i. d. R. bereits während der
   * Signaturprüfung mitvalidieren; hier bewusst separat gehalten, um die
   * fachliche Policy von der Kryptographie zu trennen).
   */
  private assertNotExpired(claims: VerifiedTokenClaims): void {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (claims.expiresAt <= nowInSeconds) {
      throw new AuthenticationError('Token ist abgelaufen.', 'invalid_or_expired_token');
    }
  }

  /** Issuer-Prüfung (Platzhalter-Prüfung, siehe Aufgabenstellung). */
  private assertIssuerMatches(claims: VerifiedTokenClaims): void {
    if (claims.issuer !== this.config.expectedIssuer) {
      throw new AuthenticationError(
        `Unerwarteter Token-Issuer: "${claims.issuer}".`,
        'issuer_mismatch',
      );
    }
  }

  /** Audience-Prüfung (Platzhalter-Prüfung, siehe Aufgabenstellung). */
  private assertAudienceMatches(claims: VerifiedTokenClaims): void {
    const audiences = Array.isArray(claims.audience) ? claims.audience : [claims.audience];
    if (!audiences.includes(this.config.expectedAudience)) {
      throw new AuthenticationError(
        'Token-Audience passt nicht zur erwarteten Applikation.',
        'audience_mismatch',
      );
    }
  }

  /**
   * Mapping ZITADEL-Organization-ID -> interne `supplierId`.
   *
   * ADR 0004 Punkt 3 markiert dieses Mapping explizit als OFFENES
   * Implementierungsdetail (1:1-Identität von Organization-ID und
   * `supplierId`, oder ein separates Mapping-Feld in der
   * `Supplier`-Entität). Dieser Konturwurf nimmt vereinfachend die
   * 1:1-Variante an, damit der Verifikationsfluss sichtbar wird — das ist
   * KEINE Festlegung dieser ADR-Frage, sondern eine bewusst markierte
   * Annahme für den Konturwurf (siehe Implementierungsnotiz in der ADR).
   */
  private toSupplierContext(claims: VerifiedTokenClaims): AuthenticatedSupplierContext {
    if (!claims.organizationId) {
      throw new AuthenticationError(
        'Token enthält keine ZITADEL-Organization-Zugehörigkeit — supplierId kann nicht ' +
          'verifiziert abgeleitet werden.',
        'missing_organization_claim',
      );
    }

    return { supplierId: claims.organizationId };
  }
}
