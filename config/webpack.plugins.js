/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const resolve = require('path').resolve;
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { ProvidePlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const getDynamicModules = require('./get-dynamic-modules');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

const deps = require('../package.json').dependencies;

const plugins = (dev = false, beta = false, restricted = false) => {
  const ChunkMapper = new (require('./chunk-mapper'))({
    modules: 'chrome',
    _unstableHotReload: dev,
  });
  return [
    ...(process.env.SOURCEMAPS === 'true'
      ? [
          new webpack.SourceMapDevToolPlugin({
            test: /\.js/i,
            filename: `sourcemaps/[name].js.map`,
          }),
        ]
      : []),
    new MiniCssExtractPlugin({
      filename: dev ? '[name].css' : '[name].[contenthash].css',
      ignoreOrder: true,
    }),
    new ModuleFederationPlugin({
      name: 'chrome',
      filename: dev ? 'chrome.js' : 'chrome.[contenthash].js',
      exposes: {
        './DownloadButton': resolve(__dirname, '../src/pdf/DownloadButton.tsx'),
        './LandingNavFavorites': resolve(__dirname, '../src/components/FavoriteServices/LandingNavFavorites.tsx'),
        './DashboardFavorites': resolve(__dirname, '../src/components/FavoriteServices/DashboardFavorites.tsx'),
        './SatelliteToken': resolve(__dirname, '../src/layouts/SatelliteToken.tsx'),
        './ModularInventory': resolve(__dirname, '../src/inventoryPoc/index.ts'),
        './search/useSearch': resolve(__dirname, '../src/hooks/useSearch.ts'),
        './analytics/intercom/OpenShiftItercom': resolve(__dirname, '../src/components/OpenShiftIntercom/OpenShiftIntercomModule.tsx'),
        './analytics/intercom/useOpenShiftIntercomStore': resolve(__dirname, '../src/state/stores/openShiftIntercomStore.ts'),
      },
      shared: [
        { react: { singleton: true, eager: true, requiredVersion: deps.react } },
        { 'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] } },
        { 'react-intl': { singleton: true, eager: true, requiredVersion: deps['react-intl'] } },
        { 'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] } },
        { '@openshift/dynamic-plugin-sdk': { singleton: true, requiredVersion: deps['@openshift/dynamic-plugin-sdk'] } },
        { '@patternfly/quickstarts': { singleton: true, requiredVersion: deps['@patternfly/quickstarts'] } },
        { '@redhat-cloud-services/chrome': { singleton: true, requiredVersion: deps['@redhat-cloud-services/chrome'] } },
        { '@scalprum/core': { singleton: true, requiredVersion: deps['@scalprum/core'] } },
        { '@scalprum/react-core': { singleton: true, requiredVersion: deps['@scalprum/react-core'] } },
        { '@unleash/proxy-client-react': { singleton: true, requiredVersion: deps['@unleash/proxy-client-react'] } },
        getDynamicModules(process.cwd()),
      ],
    }),
    ChunkMapper,
    new HtmlWebpackPlugin({
      template: restricted ? path.resolve(__dirname, '../src/indexRes.ejs') : path.resolve(__dirname, '../src/index.ejs'),
      inject: 'body',
      minify: false,
      filename: dev ? 'index.html' : '../index.html',
      base: '/',
      templateParameters: {
        pf5styles: `/${beta ? 'beta/' : ''}apps/chrome/js/pf/pf4-v5.css`,
        pf6styles: `/${beta ? 'beta/' : ''}apps/chrome/js/pf/pf-v6.css`,
      },
    }),
    new HtmlWebpackPlugin({
      title: 'Authenticating - Hybrid Cloud Console',
      filename: 'silent-check-sso.html',
      inject: false,
      minify: false,
      template: path.resolve(__dirname, '../src/silent-check-sso.html'),
    }),
    new ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new ForkTsCheckerWebpackPlugin(),
    /**
     * Removes error for a missing logger function
     * https://github.com/getsentry/sentry-javascript/issues/6596
     * https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/#tree-shaking-optional-code
     */
    new webpack.DefinePlugin({
      __SENTRY_DEBUG__: false,
    }),
    ...(dev
      ? [
          new ReactRefreshWebpackPlugin({
            overlay: false,
          }),
        ]
      : []),
    // Put the Sentry Webpack plugin after all other plugins
    ...(process.env.ENABLE_SENTRY
      ? [
          sentryWebpackPlugin({
            ...(process.env.SENTRY_AUTH_TOKEN && {
              authToken: process.env.SENTRY_AUTH_TOKEN,
            }),
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            moduleMetadata: ({ release }) => ({
              ...(process.env.SENTRY_AUTH_TOKEN && {
                authToken: process.env.SENTRY_AUTH_TOKEN,
              }),
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
              release,
            }),
          }),
        ]
      : []),
  ];
};

module.exports = plugins;
