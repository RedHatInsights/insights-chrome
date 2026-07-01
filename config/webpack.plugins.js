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

  /**
   * List of all Insights app Sentry projects that load Chrome code.
   * Chrome source maps need to be uploaded to each project so that when
   * errors occur in apps containing Chrome code, the full stack trace is readable.
   *
   * NOTE: When adding new Insights apps, add their Sentry project to this list.
   */
  const CHROME_SENTRY_PROJECTS = [
    // Insights apps (RHEL platform)
    'advisor-rhel',
    'compliance-rhel',
    'dashboard-rhel',
    'image-builder-rhel',
    'inventory-rhel',
    'malware-rhel',
    'patchman-rhel',
    'policies-rhel',
    'registration-assistant-rhel',
    'remediations-rhel',
    'tasks-rhel',
    'vulnerability-rhel',
    // Other Insights components
    'content-sources',
    // Console platform apps (cpin namespace)
    'cpin-001-ansible',
    'cpin-001-cloud-settings',
    'cpin-001-insights', // Chrome's primary project
    'cpin-001-landing-page',
  ];

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
        './LandingNavFavorites': resolve(__dirname, '../src/components/FavoriteServices/LandingNavFavorites.tsx'),
        './DashboardFavorites': resolve(__dirname, '../src/components/FavoriteServices/DashboardFavorites.tsx'),
        './SatelliteToken': resolve(__dirname, '../src/layouts/SatelliteToken.tsx'),
        './ModularInventory': resolve(__dirname, '../src/inventoryPoc/index.ts'),
        './search/useSearch': resolve(__dirname, '../src/hooks/useSearch.ts'),
        './search/useOramaSearch': resolve(__dirname, '../src/hooks/useOramaSearch.ts'),
        './analytics/intercom/OpenShiftItercom': resolve(__dirname, '../src/components/OpenShiftIntercom/OpenShiftIntercomModule.tsx'),
        './analytics/intercom/useOpenShiftIntercomStore': resolve(__dirname, '../src/state/stores/openShiftIntercomStore.ts'),
      },
      shared: [
        { react: { singleton: true, eager: true, requiredVersion: deps.react } },
        { 'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] } },
        { 'react/jsx-runtime': { singleton: true, eager: true, requiredVersion: deps.react } },
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
        pf6styles: `/apps/chrome/js/pf/pf-v6.css`,
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
    // Put the Sentry Webpack plugins after all other plugins
    // Upload Chrome source maps to ALL app projects (single plugin + project[] — see plugin README "Multi-Project")
    ...(process.env.ENABLE_SENTRY
      ? [
          sentryWebpackPlugin({
            ...(process.env.SENTRY_AUTH_TOKEN && {
              authToken: process.env.SENTRY_AUTH_TOKEN,
            }),
            org: 'red-hat-it',
            project: CHROME_SENTRY_PROJECTS,
            silent: false,
            // Avoid failing the webpack build on transient Sentry/network/auth issues; watch Konflux logs for warnings.
            errorHandler: (err) => {
              console.warn('[Sentry webpack plugin] Source map upload failed:', err);
            },
            release: {
              name: process.env.SENTRY_RELEASE,
              inject: false, // Don't inject SDK - Chrome already has it
              uploadLegacySourcemaps: {
                paths: ['dist/js'],
                urlPrefix: '/apps/chrome/js',
                rewrite: true,
              },
            },
            moduleMetadata: ({ release, projects }) => ({
              org: 'red-hat-it',
              projects,
              release,
            }),
          }),
        ]
      : []),
  ];
};

module.exports = plugins;
