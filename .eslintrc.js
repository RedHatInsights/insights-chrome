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
      },
    },
  ],
};
