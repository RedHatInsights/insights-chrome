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

const deps = require('../package.json').dependencies;

const plugins = (dev = false, beta = false) => {
  const ChunkMapper = new (require('@redhat-cloud-services/frontend-components-config-utilities/chunk-mapper'))({
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
      filename: dev ? '[name].css' : '[name].[fullhash].css',
    }),
    new ModuleFederationPlugin({
      name: 'chrome',
      filename: dev ? 'chrome.js' : 'chrome.[fullhash].js',
      exposes: {
        './DownloadButton': resolve(__dirname, '../src/pdf/DownloadButton.tsx'),
      },
      shared: [
        { react: { singleton: true, eager: true, requiredVersion: deps.react } },
        { 'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] } },
        { 'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] } },
        { 'react-redux': { requiredVersion: deps['react-redux'] } },
        { '@openshift/dynamic-plugin-sdk': { singleton: true, requiredVersion: deps['@openshift/dynamic-plugin-sdk'] } },
        { '@patternfly/react-core': { requiredVersion: deps['@patternfly/react-core'] } },
        { '@patternfly/quickstarts': { singleton: true, requiredVersion: deps['@patternfly/quickstarts'] } },
        { '@redhat-cloud-services/chrome': { singleton: true, requiredVersion: deps['@redhat-cloud-services/chrome'] } },
        { '@scalprum/react-core': { singleton: true, requiredVersion: deps['@scalprum/react-core'] } },
        { '@unleash/proxy-client-react': { singleton: true, requiredVersion: deps['@unleash/proxy-client-react'] } },
      ],
    }),
    ChunkMapper,
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/index.html'),
      inject: 'body',
      minify: false,
      filename: dev ? 'index.html' : '../index.html',
      base: beta ? '/beta/' : '/',
    }),
    new HtmlWebpackPlugin({
      title: 'Authenticating - console.redhat.com',
      filename: dev ? 'silent-check-sso.html' : '../silent-check-sso.html',
      inject: false,
      minify: false,
      template: path.resolve(__dirname, '../src/silent-check-sso.html'),
    }),
    new ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new ForkTsCheckerWebpackPlugin(),
    ...(dev ? [new ReactRefreshWebpackPlugin()] : []),
  ];
};

module.exports = plugins;
