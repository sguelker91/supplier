/**
 * Eigener Entry-Point statt des Standard-`node_modules/expo/AppEntry.js`.
 *
 * In diesem npm-Workspaces-Monorepo (ADR 0007) wird `expo` in das
 * Root-`node_modules` gehoben. `expo/AppEntry.js` importiert `App` per
 * relativem Pfad (`../../App`) von seinem eigenen Verzeichnis aus -- das
 * zeigt dann auf den Repo-Root statt auf `apps/mobile/App.tsx` und schlägt
 * mit "Cannot resolve entry file" fehl (Expo-Monorepo-Guidance:
 * https://docs.expo.dev/guides/monorepos/#expo-cli-entry-point-configuration).
 */
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
