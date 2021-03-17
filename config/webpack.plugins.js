const webpack = require('webpack');
const resolve = require('path').resolve;
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('../package.json').dependencies;
const ChunkMapper = new (require('@redhat-cloud-services/frontend-components-config/chunk-mapper'))({
  modules: 'chrome',
});

const plugins = [
  new WriteFileWebpackPlugin(),
  new webpack.SourceMapDevToolPlugin({
    test: /\.js/i,
    filename: `sourcemaps/[name].js.map`,
  }),
  new ModuleFederationPlugin({
    name: 'chrome',
    filename: 'chrome.[hash].js',
    exposes: {
      './InventoryTable': resolve(__dirname, '../src/js/inventory/modules/InventoryTable.js'),
      './AppInfo': resolve(__dirname, '../src/js/inventory/modules/AppInfo.js'),
      './InventoryDetailHead': resolve(__dirname, '../src/js/inventory/modules/InventoryDetailHead.js'),
      './InventoryDetail': resolve(__dirname, '../src/js/inventory/modules/InventoryDetail.js'),
      './TagWithDialog': resolve(__dirname, '../src/js/inventory/modules/TagWithDialog.js'),
      './DetailWrapper': resolve(__dirname, '../src/js/inventory/modules/DetailWrapper.js'),
      './useChromeAuth': resolve(__dirname, '../src/js/jwt/modules/useChromeAuth.js'),
    },
    shared: [
      { react: { singleton: true, requiredVersion: deps.react } },
      { 'react-dom': { singleton: true, requiredVersion: deps['react-dom'] } },
      { 'react-router-dom': { requiredVersion: deps['react-router-dom'] } },
      { 'react-redux': { requiredVersion: deps['react-redux'] } },
      { '@patternfly/react-table': { requiredVersion: deps['react-table'] } },
      { '@patternfly/react-core': { requiredVersion: deps['react-core'] } },
    ],
  }),
  ChunkMapper,
];

module.exports = plugins;
