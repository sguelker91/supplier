/**
 * Jest-Konfiguration für apps/mobile gemäß ADR 0005 (Jest einheitlich,
 * `jest-expo`-Preset als von Expo offiziell dokumentierter Standardweg).
 */
module.exports = {
  preset: 'jest-expo',
  testRegex: '.*\\.(spec|test)\\.(ts|tsx)$',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
