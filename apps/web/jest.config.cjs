/**
 * Jest-Konfiguration für apps/web gemäß ADR 0005 (Jest einheitlich) mit
 * ts-jest als Transpiler und React Testing Library (Umsetzungsdetails,
 * von ADR 0005 bewusst offengelassen).
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  testRegex: '.*\\.(spec|test)\\.tsx?$',
  moduleFileExtensions: ['tsx', 'ts', 'jsx', 'js', 'json'],
moduleNameMapper: {
  '\\.module\\.css$': '<rootDir>/src/test-setup/css-module-mock.cjs',
  '.*/vite-env-url$': '<rootDir>/src/test-setup/vite-env-url.mock.ts',
},
  
  setupFilesAfterEnv: ['<rootDir>/src/test-setup/jest.setup.ts'],
};
