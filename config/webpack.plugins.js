const webpack = require('webpack');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');

const { ModuleFederationPlugin } = require('webpack').container;

const plugins = [
  new ModuleFederationPlugin({
    name: 'chrome',
    library: { type: 'var', name: 'chrome' },
    filename: 'remoteEntry.js',
    exposes: {
      './foo': path.resolve(__dirname, '../src/js/chrome.js'),
    },
    shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
  }),
  new CleanWebpackPlugin(),
  new WriteFileWebpackPlugin(),
  new webpack.SourceMapDevToolPlugin({
    test: /\.js/i,
    exclude: /node_modules/i,
    filename: `sourcemaps/[name].js.map`,
  }),
];

module.exports = plugins;
