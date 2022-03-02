module.exports = {
  extends: '@redhat-cloud-services/eslint-config-redhat-cloud-services',
  globals: {
    insights: 'writable',
  },
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'react/prop-types': 'off',
      },
    },
  ],
};
