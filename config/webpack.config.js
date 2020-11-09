const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');
const TerserPlugin = require('terser-webpack-plugin');

const commonConfig = ({ publicPath, noHash }) => ({
  entry: path.resolve(__dirname, '../src/js/chrome.js'),
  output: {
    path: path.resolve(__dirname, '../build/js'),
    filename: `chrome${noHash ? '' : '.[chunkhash]'}.js`,
    publicPath,
    chunkFilename: `[name]${noHash ? '' : '.[chunkhash]'}.js`,
  },
  resolve: {
    alias: {
      PFReactTable: path.resolve(__dirname, './patternfly-table-externals.js'),
      customReact: path.resolve(__dirname, './react-external.js'),
      reactRedux: path.resolve(__dirname, './react-redux-external.js'),
      // 'react-router-dom': path.resolve(__dirname, './react-router-dom-externals.js'), we will require different router alias
      PFReactCore: path.resolve(__dirname, './patternfly-react-externals.js'),
    },
  },
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /src\/.*\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'source-map-loader' }, { loader: 'babel-loader' }],
      },
      {
        test: /\.s?[ac]ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpg|png|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      },
    ],
  },
  plugins,
});

module.exports = function (env) {
  const config = commonConfig({ publicPath: env.publicPath, noHash: env.noHash === 'true' });
  if (env.analyze === 'true') {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  return config;
};
