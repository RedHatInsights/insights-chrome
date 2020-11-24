const webpack = require('webpack');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('../package.json').dependencies;

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
    remotes: {
      advisor: 'advisor@http://localhost:8002/advisor.js',
    },
    shared: [
      { react: { singleton: true, requiredVersion: deps.react } },
      { 'react-dom': { singleton: true, requiredVersion: deps['react-dom'] } },
      // { 'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] } },
    ],
  }),
];

module.exports = plugins;
