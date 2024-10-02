/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { createJoinFunction, createJoinImplementation, asGenerator, defaultJoinGenerator } = require('resolve-url-loader');
const searchIgnoredStyles = require('@redhat-cloud-services/frontend-components-config-utilities/search-ignored-styles');
const { defineConfig } = require('@rspack/cli');
const rspack = require('@rspack/core');

// call default generator then pair different variations of uri with each base
const PFGenerator = asGenerator((item, ...rest) => {
  const defaultTuples = [...defaultJoinGenerator(item, ...rest)];
  if (item.uri.includes('./assets')) {
    return defaultTuples.map(([base]) => {
      if (base.includes('@patternfly/patternfly')) {
        return [base, path.relative(base, path.resolve(__dirname, '../node_modules/@patternfly/patternfly', item.uri))];
      }
    });
  }
  return defaultTuples;
});

/** @type { import("webpack").Configuration } */
const JSConfig = defineConfig({
  experiments: {
    css: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: true,
                },
              },
            },
          },
        },
      },
      {
        test: /\.s?[ac]ss$/,
        type: 'css/auto',
        use: [
          {
            loader: 'resolve-url-loader',
            options: {
              join: createJoinFunction('myJoinFn', createJoinImplementation(PFGenerator)),
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              api: 'modern-compiler',
              implementation: require.resolve('sass-embedded'),
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['...', '.tsx', '.ts', '.js'],
    alias: {
      ...searchIgnoredStyles(path.resolve(__dirname, '../')),
      '@rhds/icons': path.resolve(__dirname, '../node_modules/@rhds/icons'),
    },
  },
  output: {
    filename: 'bundle.js',
    hashFunction: 'xxhash64',
    path: path.resolve(__dirname, 'dist'),
  },
  cache: true,
  stats: {
    errorDetails: true,
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: 'chrome',
      filename: 'chrome.js',
      shared: [
        { react: { singleton: true, eager: true } },
        { 'react-dom': { singleton: true, eager: true } },
        { 'react-router-dom': { singleton: true } },
        { 'react-redux': {} },
        { '@openshift/dynamic-plugin-sdk': { singleton: true } },
        { '@patternfly/react-core': {} },
        { '@patternfly/quickstarts': { singleton: true } },
        { '@scalprum/core': { singleton: true } },
        { '@scalprum/react-core': { singleton: true } },
        { '@unleash/proxy-client-react': { singleton: true } },
      ],
    }),
  ],
});

module.exports = JSConfig;
