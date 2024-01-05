module.exports = {
  extends: '@redhat-cloud-services/eslint-config-redhat-cloud-services',
  globals: {
    insights: 'writable',
  },
  rules: {
    'sort-imports': [
      2,
      {
        ignoreDeclarationSort: true,
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'react/prop-types': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, args: 'after-used' }],
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
  ],
};
