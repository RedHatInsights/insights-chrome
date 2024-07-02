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

const deps = require('../package.json').dependencies;

const isOutdatedBrowserChunk = (chunk) => {
  return chunk.includes('outdated-browser');
};

// outdated-browser should appear first so that it has a chance to display an
// error before any potentially-broken code runs on an older browser.
const compareHtmlChunks = (chunkA, chunkB) => {
  const isOutdatedA = isOutdatedBrowserChunk(chunkA);
  const isOutdatedB = isOutdatedBrowserChunk(chunkB);

  if (isOutdatedA !== isOutdatedB) {
    // Descending ordering: the outdated-browser chunk comes first.
    return isOutdatedA < isOutdatedB ? 1 : -1;
  }

  return chunkA.localeCompare(chunkB, 'en');
};

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
      },
      shared: [
        { react: { singleton: true, eager: true, requiredVersion: deps.react } },
        { 'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] } },
        { 'react-intl': { singleton: true, eager: true, requiredVersion: deps['react-intl'] } },
        { 'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] } },
        { 'react-redux': { requiredVersion: deps['react-redux'] } },
        { '@openshift/dynamic-plugin-sdk': { singleton: true, requiredVersion: deps['@openshift/dynamic-plugin-sdk'] } },
        { '@patternfly/quickstarts': { singleton: true, requiredVersion: deps['@patternfly/quickstarts'] } },
        { '@redhat-cloud-services/chrome': { singleton: true, requiredVersion: deps['@redhat-cloud-services/chrome'] } },
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
      chunksSortMode: compareHtmlChunks,
      filename: dev ? 'index.html' : '../index.html',
      // FIXME: Change to /preview on May
      base: beta ? '/beta/' : '/',
      templateParameters: {
        pf4styles: `/${beta ? 'beta/' : ''}apps/chrome/js/pf/pf4-v4.css`,
        pf5styles: `/${beta ? 'beta/' : ''}apps/chrome/js/pf/pf4-v5.css`,
      },
    }),
    new HtmlWebpackPlugin({
      title: 'Authenticating - Hybrid Cloud Console',
      filename: dev ? 'silent-check-sso.html' : '../silent-check-sso.html',
      inject: false,
      minify: false,
      chunksSortMode: compareHtmlChunks,
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
    ...(dev ? [new ReactRefreshWebpackPlugin()] : []),
  ];
};

module.exports = plugins;
