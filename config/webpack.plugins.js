const webpack = require('webpack');
const resolve = require('path').resolve;
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('../package.json').dependencies;
const ChunkMapper = new (require('./chunk-mapper'))({
  modules: 'chrome',
});

const plugins = [
  new WriteFileWebpackPlugin(),
  new webpack.SourceMapDevToolPlugin({
    test: /\.js/i,
    exclude: /node_modules/i,
    filename: `sourcemaps/[name].js.map`,
  }),
  new ModuleFederationPlugin({
    name: 'chrome',
    filename: 'chrome.[hash].js',
    exposes: {
      './InventoryTable': resolve(__dirname, '../src/js/inventory/inventory-table.js'),
    },
    shared: [
      { react: { singleton: true, requiredVersion: deps.react } },
      { 'react-dom': { singleton: true, requiredVersion: deps['react-dom'] } },
      { 'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] } },
      { '@patternfly/react-table': { singleton: true } },
      { '@patternfly/react-core': { singleton: true } },
      { 'react-redux': { singleton: true } },
    ],
  }),
  ChunkMapper,
];

module.exports = plugins;
