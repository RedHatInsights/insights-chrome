// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const resolver = path.resolve(__dirname, './scripts/testResolver.js');

module.exports = {
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', 'src/**/*.ts', '!src/**/*Styles.js'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://test.com',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!@redhat-cloud-services|@openshift|lodash-es|@patternfly/react-core/components|@patternfly/react-core/next|@patternfly/react-core/helpers|@patternfly/react-core/node_modules/@patternfly/react-tokens/dist/esm|@patternfly/react-icons/dist/esm).+(js|jsx)$',
  ],
    transform: {
    '^.+\\.(ts|js)x?$': [
      '@swc/jest',
      {
        $schema: 'http://json.schemastore.org/swcrc',

        jsc: {
          experimental: {
            plugins: [['jest_workaround', {}]],
          },
          parser: {
            jsx: true,
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  roots: ['<rootDir>/src/'],
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  setupFiles: ['<rootDir>/config/setupTests.js'],
  setupFilesAfterEnv: ['<rootDir>/config/jest.scripts.js'],
  resolver,
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
};
