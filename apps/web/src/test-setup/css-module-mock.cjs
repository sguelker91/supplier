/**
 * Jest-Mock für CSS-Modul-Importe (`*.module.css`). Jest kann CSS nicht
 * verarbeiten; die meisten Tests interessieren sich ohnehin nur für
 * Rollen/Text, nicht für konkrete Klassennamen -- ein Proxy, der jeden
 * Property-Zugriff als String zurückgibt, reicht dafür aus. Manche Tests
 * (z. B. `AppShell.spec.tsx`, ADR 0009) prüfen aber gezielt auf
 * zusammengesetzte Klassennamen (`toHaveClass(...)`) -- dafür müssen die
 * zurückgegebenen Werte tatsächlich die Property-Namen als String sein.
 *
 * WICHTIG: `__esModule` MUSS hier `undefined` (falsy) zurückgeben, sonst
 * hält TypeScripts `esModuleInterop`-Hilfsfunktion (`__importDefault`)
 * diesen Proxy fälschlich für ein bereits transpiliertes ES-Modul und
 * überspringt das Einwickeln in `{ default: <modul> }` -- ein
 * `import styles from './x.module.css'`-Default-Import würde dann
 * fälschlich den String `"default"` statt des Proxys selbst erhalten
 * (der generische `get`-Trap liefert für JEDEN String-Property-Namen,
 * inklusive `"__esModule"` und `"default"`, ansonsten unterschiedslos den
 * Namen selbst zurück).
 */
module.exports = new Proxy(
  {},
  {
    get: (_target, property) => {
      if (property === '__esModule') {
        return undefined;
      }
      return typeof property === 'string' ? property : undefined;
    },
  },
);
