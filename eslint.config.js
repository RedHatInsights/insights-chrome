/* eslint-disable @typescript-eslint/no-require-imports */
const { defineConfig } = require('eslint/config');

const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const globals = require('globals');
const fecPlugin = require('@redhat-cloud-services/eslint-config-redhat-cloud-services');

// Create a patched version of browser globals (from Red Hat config)
const patchedBrowserGlobals = { ...globals.browser };
delete patchedBrowserGlobals['AudioWorkletGlobalScope '];
patchedBrowserGlobals['AudioWorkletGlobalScope'] = 'readonly';

module.exports = defineConfig(
  fecPlugin,
  // Global settings for the project
  {
    name: 'insights-chrome/global',
    languageOptions: {
      globals: {
        insights: 'writable',
      },
    },
    rules: {
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
    },
  },

  // TypeScript-specific configuration
  {
    name: 'insights-chrome/typescript',
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'after-used', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-imports': [
        'error',
        {
          // restrict importing auth packages methods directly
          // Use of the ChromeAuthContext must be enforced
          paths: [
            {
              name: 'react-oidc-context',
              message: 'Do not import react-oidc-context directly. Use the ChromeAuthContext instead!',
            },
            {
              name: 'oidc-client-ts',
              message: 'Do not import oidc-client-ts directly. Use the ChromeAuthContext instead!',
            },
          ],
          patterns: [
            {
              group: ['**/cognito/*'],
              message: 'Do not import cognito auth methods directly. Use the ChromeAuthContext instead!',
            },
            {
              group: ['**/OIDCConnector/utils'],
              message: 'Do not OIDC auth utils directly. Use the ChromeAuthContext instead!',
            },
          ],
        },
      ],
    },
  },

  // Cypress-specific configuration
  {
    name: 'insights-chrome/cypress',
    files: ['cypress/**/*.ts', 'cypress/**/*.tsx', 'cypress/**/*.js'],
    languageOptions: {
      parser: typescriptParser,
      globals: {
        cy: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/triple-slash-reference': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'after-used', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off',
    },
  },

  // OIDCConnector-specific configuration
  {
    name: 'insights-chrome/oidc-connector',
    files: ['src/auth/OIDCConnector/**/*.ts', 'src/auth/OIDCConnector/**/*.tsx', 'src/auth/OIDCConnector/**/*.js'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
