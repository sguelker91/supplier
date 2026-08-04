/**
 * Jest-Konfiguration für apps/api gemäß ADR 0005 (Jest einheitlich)
 * mit ts-jest als Transpiler (Umsetzungsdetail, von ADR 0005 bewusst
 * offengelassen).
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
};
