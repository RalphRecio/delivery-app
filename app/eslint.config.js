const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    // Expo registers the TypeScript plugin for TS files only, so our TS rules are scoped the same way.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: 'Import a feature only through its index.ts (e.g. "@/features/booking").',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'coverage/', 'expo-env.d.ts'],
  },
]);
