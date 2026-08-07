/**
 * Basis-URL für HTTP-Aufrufe gegen `apps/api`.
 *
 * Analog zu `ZITADEL_ISSUER`/`ZITADEL_WEB_CLIENT_ID`
 * (`../auth/zitadel-config.ts`): `apps/web` besitzt bislang KEIN
 * entschiedenes Env-/Secrets-Konzept (siehe dortige Begründung). Diese
 * Konstante ist daher bewusst ein Klartext-Platzhalter für lokale
 * Entwicklung, kein Sicherheitsproblem (keine geheime Information), aber
 * unflexibel für mehrere Umgebungen (Staging/Produktion) -- offener Punkt,
 * siehe Implementierungsnotiz im Backlog.
 */
export const API_BASE_URL = 'http://localhost:3000';
