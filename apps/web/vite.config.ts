/**
 * Vite als Build-Tool für apps/web.
 *
 * ADR-Lage: Keine ADR trifft eine Web-Bundler-Entscheidung (ADR 0003/0007
 * entscheiden ausdrücklich nur Monorepo-Struktur bzw. Workspace-/
 * Paketmanager-Tooling, nicht den App-internen Bundler je Workspace).
 * Vite wurde als unstrittiges, leichtgewichtiges React+TS-Standard-
 * Setup gewählt (siehe Implementierungsnotiz in
 * docs/backlog/lieferant-kontrakte-einsehen.md) -- keine Turborepo/Nx-
 * Bezüge, kein Widerspruch zu ADR 0007.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
