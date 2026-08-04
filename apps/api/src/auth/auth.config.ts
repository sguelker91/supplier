/**
 * Liest die für ADR 0004 nötige ZITADEL-Konfiguration aus Umgebungsvariablen
 * (siehe `.env.example`). Wirft absichtlich einen harten Fehler beim Start,
 * wenn Pflichtwerte fehlen -- kein stiller Fallback auf einen erfundenen
 * Issuer/Audience-Wert (konsistent mit dem "kein stiller Fallback"-Prinzip,
 * das `AuthGuardService`/`TokenVerifier` bereits für Verifikationsfehler
 * durchsetzen).
 */

import type { AuthGuardConfig } from './auth-guard.service';

export function readZitadelIssuerFromEnv(): string {
  const issuer = process.env.ZITADEL_ISSUER;
  if (!issuer) {
    throw new Error(
      'Umgebungsvariable ZITADEL_ISSUER ist nicht gesetzt (siehe apps/api/.env.example).',
    );
  }
  return issuer;
}

export function readZitadelJwksUriFromEnv(): string {
  return process.env.ZITADEL_JWKS_URI ?? `${readZitadelIssuerFromEnv()}/oauth/v2/keys`;
}

export function createAuthGuardConfigFromEnv(): AuthGuardConfig {
  const expectedAudience = process.env.ZITADEL_AUDIENCE;
  if (!expectedAudience) {
    throw new Error(
      'Umgebungsvariable ZITADEL_AUDIENCE ist nicht gesetzt (siehe apps/api/.env.example, ' +
        'ADR 0004 "Offene Annahmen" -- dieser Wert ist projektspezifisch und wird bewusst ' +
        'nicht erfunden).',
    );
  }
  return {
    expectedIssuer: readZitadelIssuerFromEnv(),
    expectedAudience,
  };
}
