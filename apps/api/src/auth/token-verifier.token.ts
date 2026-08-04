/**
 * DI-Token für `TokenVerifier` (siehe `token-verifier.interface.ts`).
 *
 * NestJS kann TypeScript-Interfaces zur Laufzeit nicht als DI-Token nutzen
 * (Interfaces werden beim Kompilieren gelöscht) -- daher dieses `Symbol`
 * als expliziter Injection-Token, konsistent mit dem Interface-basierten
 * Design aus ADR 0004.
 */
export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');
