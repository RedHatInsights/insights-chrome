const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { createJoinFunction, createJoinImplementation, asGenerator, defaultJoinGenerator } = require('resolve-url-loader');
const searchIgnoredStyles = require('@redhat-cloud-services/frontend-components-config-utilities/search-ignored-styles');
const proxy = require('@redhat-cloud-services/frontend-components-config-utilities/proxy');

// call default generator then pair different variations of uri with each base
const myGenerator = asGenerator((item, ...rest) => {
  const defaultTuples = [...defaultJoinGenerator(item, ...rest)];
  if (item.uri.includes('./assets')) {
    return defaultTuples.map(([base]) => {
      if (base.includes('@patternfly/patternfly')) {
        return [base, path.relative(base, path.resolve(__dirname, '../node_modules/@patternfly/patternfly', item.uri))];
      }
    });
  }
  return defaultTuples;
});

const commonConfig = ({ dev, publicPath = '/', noHash }) => ({
  entry: [path.resolve(__dirname, '../src/sass/chrome.scss'), path.resolve(__dirname, '../src/js/chrome.js')],
  output: {
    path: path.resolve(__dirname, '../build/js'),
    filename: `chrome-root${noHash ? '' : '.[chunkhash]'}.js`,
    publicPath,
    chunkFilename: `[name]${noHash ? '' : '.[chunkhash]'}.js`,
  },
  devtool: false,
  resolve: {
    alias: {
      ...searchIgnoredStyles(path.resolve(__dirname, '../')),
      '@scalprum/core': path.resolve(__dirname, '../node_modules/@scalprum/core'),
      '@scalprum/react-core': path.resolve(__dirname, '../node_modules/@scalprum/react-core'),
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
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'resolve-url-loader',
            options: {
              join: createJoinFunction('myJoinFn', createJoinImplementation(myGenerator)),
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(jpg|png|svg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: '../assets/images/',
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|jpg|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: '../assets/fonts/',
            },
          },
        ],
      },
    ],
  },
  plugins: plugins(dev),
  devServer: {
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    },
    historyApiFallback: {
      index: `${publicPath}index.html`,
    },
    https: true,
    port: 1337,
    ...proxy({
      env: 'stage-beta',
      port: 1337,
      appUrl: [/^\/*$/, /^\/beta\/*$/],
      useProxy: true,
      publicPath,
      proxyVerbose: true,
      isChrome: true,
    }),
  },
});

module.exports = function (env) {
  const config = commonConfig({ dev: env.devServer === 'true', publicPath: env.publicPath, noHash: env.noHash === 'true' });
  if (env.analyze === 'true') {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  return config;
};
