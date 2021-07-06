const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');
const TerserPlugin = require('terser-webpack-plugin');

const commonConfig = ({ publicPath, noHash }) => ({
  entry: [path.resolve(__dirname, '../src/js/chrome.js')],
  output: {
    path: path.resolve(__dirname, '../build/js'),
    filename: `chrome-root${noHash ? '' : '.[chunkhash]'}.js`,
    publicPath,
    chunkFilename: `[name]${noHash ? '' : '.[chunkhash]'}.js`,
  },
  devtool: false,
  resolve: {
    alias: {
      PFReactTable: path.resolve(__dirname, './patternfly-table-externals.js'),
      customReact: path.resolve(__dirname, './react-external.js'),
      reactRedux: path.resolve(__dirname, './react-redux-external.js'),
      PFReactCore: path.resolve(__dirname, './patternfly-react-externals.js'),
    },
    fallback: {
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      url: require.resolve('url/'),
    },
  },
  optimization: {
    minimizer: [new TerserPlugin()],
    concatenateModules: false,
  },
  module: {
    rules: [
      {
        test: /src\/.*\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.s?[ac]ss$/,
        use: [
          'style-loader',
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
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
      {
        test: /\.pug$/,
        use: ['pug-loader'],
      },
    ],
  },
  plugins,
  devServer: {
    writeToDisk: true,
  },
});

module.exports = function (env) {
  const config = commonConfig({ publicPath: env.publicPath, noHash: env.noHash === 'true' });
  if (env.analyze === 'true') {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  return config;
};
