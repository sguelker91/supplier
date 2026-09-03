/**
 * Basis-URL für HTTP-Aufrufe gegen `apps/api`.
 * Zur Build-Zeit über VITE_API_URL konfigurierbar, fällt lokal auf
 * localhost:3000 zurück, falls nicht gesetzt.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
