import { Module } from '@nestjs/common';

import { AUTH_GUARD_CONFIG } from './auth-guard-config.token';
import { AuthGuardService } from './auth-guard.service';
import { createAuthGuardConfigFromEnv, readZitadelJwksUriFromEnv } from './auth.config';
import { JoseTokenVerifier } from './jose-token-verifier';
import { TOKEN_VERIFIER } from './token-verifier.token';
import { ZitadelAuthGuard } from './zitadel-auth.guard';

/**
 * Verdrahtet ADR 0004 (ZITADEL-Tokenverifikation) fürs Modul-System:
 * - `TOKEN_VERIFIER` -> echte `JoseTokenVerifier`-Implementierung gegen den
 *   JWKS-Endpoint der per Umgebungsvariable konfigurierten ZITADEL-Instanz.
 * - `AUTH_GUARD_CONFIG` -> Issuer/Audience aus Umgebungsvariablen.
 *
 * Tests ersetzen `TOKEN_VERIFIER` über `overrideProvider(...)` mit einem
 * Test-Double (siehe `testing/fake-token-verifier.ts`), damit CI gemäß
 * ADR 0006 Punkt 3 NIEMALS gegen die echte ZITADEL-Cloud-Instanz läuft.
 */
@Module({
  providers: [
    {
      provide: TOKEN_VERIFIER,
      useFactory: () => new JoseTokenVerifier(readZitadelJwksUriFromEnv()),
    },
    {
      provide: AUTH_GUARD_CONFIG,
      useFactory: () => createAuthGuardConfigFromEnv(),
    },
    AuthGuardService,
    ZitadelAuthGuard,
  ],
  exports: [AuthGuardService, ZitadelAuthGuard],
})
export class AuthModule {}
