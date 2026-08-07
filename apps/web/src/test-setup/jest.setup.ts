import { TextDecoder, TextEncoder } from 'node:util';

import '@testing-library/jest-dom';

// jsdom (Jest-Testumgebung, siehe jest.config.cjs) stellt `TextEncoder`/
// `TextDecoder` nicht global bereit, `react-router-dom` (ADR 0009
// Abschnitt 2) benötigt sie transitiv beim Import. Polyfill über die
// Node-eigene Implementierung, kein zusätzliches npm-Paket nötig.
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}
