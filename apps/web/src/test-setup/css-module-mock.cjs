/**
 * Jest-Mock für CSS-Modul-Importe (`*.module.css`). Jest kann CSS nicht
 * verarbeiten; Tests interessieren sich ohnehin nur für Rollen/Text, nicht
 * für konkrete Klassennamen -- ein Proxy, der jeden Property-Zugriff als
 * String zurückgibt, reicht dafür aus.
 */
module.exports = new Proxy(
  {},
  {
    get: (_target, property) => (typeof property === 'string' ? property : undefined),
  },
);
