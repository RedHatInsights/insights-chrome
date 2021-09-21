const webpack = require('webpack');
const resolve = require('path').resolve;
const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { ProvidePlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const deps = require('../package.json').dependencies;
const ChunkMapper = new (require('@redhat-cloud-services/frontend-components-config-utilities/chunk-mapper'))({
  modules: 'chrome',
});

const plugins = [
  ...(process.env.SOURCEMAPS === 'true'
    ? [
        new webpack.SourceMapDevToolPlugin({
          test: /\.js/i,
          filename: `sourcemaps/[name].js.map`,
        }),
      ]
    : []),
  new MiniCssExtractPlugin({
    filename: '[name].css',
  }),
  new ModuleFederationPlugin({
    name: 'chrome',
    filename: 'chrome.[contenthash].js',
    exposes: {
      './InventoryTable': resolve(__dirname, '../src/js/inventory/modules/InventoryTable.js'),
      './AppInfo': resolve(__dirname, '../src/js/inventory/modules/AppInfo.js'),
      './InventoryDetailHead': resolve(__dirname, '../src/js/inventory/modules/InventoryDetailHead.js'),
      './InventoryDetail': resolve(__dirname, '../src/js/inventory/modules/InventoryDetail.js'),
      './TagWithDialog': resolve(__dirname, '../src/js/inventory/modules/TagWithDialog.js'),
      './DetailWrapper': resolve(__dirname, '../src/js/inventory/modules/DetailWrapper.js'),
      './DownloadButton': resolve(__dirname, '../src/js/pdf/DownloadButton.js'),
      './useChromeAuth': resolve(__dirname, '../src/js/jwt/modules/useChromeAuth.js'),
    },
    shared: [
      { react: { singleton: true, eager: true, requiredVersion: deps.react } },
      { 'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] } },
      { 'react-router-dom': { requiredVersion: deps['react-router-dom'] } },
      { 'react-redux': { requiredVersion: deps['react-redux'] } },
      { '@patternfly/react-table': { requiredVersion: deps['@patternfly/react-table'] } },
      { '@patternfly/react-core': { requiredVersion: deps['@patternfly/react-core'] } },
      { '@patternfly/quickstarts': { singleton: true, requiredVersion: deps['@patternfly/quickstarts'] } },
      { '@scalprum/react-core': { singleton: true, requiredVersion: deps['@scalprum/react-core'] } },
      { '@redhat-cloud-services/frontend-components-pdf-generator': { singleton: true } },
    ],
  }),
  ChunkMapper,
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, '../src/index.html'),
    inject: 'body',
    filename: '../index.html',
  }),
  new HtmlWebpackPlugin({
    title: 'Authenticating - console.redhat.com',
    filename: 'silent-check-sso.html',
    chunks: [''],
    template: path.resolve(__dirname, '../src/silent-check-sso.html'),
  }),
  new ProvidePlugin({
    process: 'process/browser.js',
    Buffer: ['buffer', 'Buffer'],
  }),
];

module.exports = plugins;
