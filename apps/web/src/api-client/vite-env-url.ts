/**
 * Isolierter Zugriff auf import.meta.env, damit Jest (ts-jest, CommonJS)
 * diese Vite-spezifische Syntax nicht selbst parsen muss. In Tests wird
 * diese Datei über jest.config.js moduleNameMapper gegen eine Attrappe
 * ausgetauscht (siehe src/test-setup/vite-env-url.mock.ts).
 */
export const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined;
