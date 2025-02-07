/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { createJoinFunction, createJoinImplementation, asGenerator, defaultJoinGenerator } = require('resolve-url-loader');
const searchIgnoredStyles = require('@redhat-cloud-services/frontend-components-config-utilities/search-ignored-styles');
const proxy = require('@redhat-cloud-services/frontend-components-config-utilities/proxy');
const imageNullLoader = require('./image-null-loader');

// call default generator then pair different variations of uri with each base
const PFGenerator = asGenerator((item, ...rest) => {
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

const publicPath = '/apps/chrome/js/';
const commonConfig = ({ dev }) => {
  /** @type { import("webpack").Configuration } */
  return {
    entry: dev
      ? // HMR request react, react-dom and react-refresh/runtime to be in the same chunk
        {
          main: path.resolve(__dirname, '../src/index.ts'),
          vendors: ['react', 'react-dom', 'react-refresh/runtime'],
        }
      : path.resolve(__dirname, '../src/index.ts'),
    output: {
      path: path.resolve(__dirname, '../build/js'),
      // the HMR needs dynamic entry filename to remove name conflicts
      filename: dev ? '[name].js' : 'chrome-root.[contenthash].js',
      hashFunction: 'xxhash64',
      publicPath,
      chunkFilename: dev ? '[name].js' : '[name].[contenthash].js',
    },
    ...(dev
      ? {
          cache: {
            type: 'filesystem',
            buildDependencies: {
              config: [__filename],
            },
            cacheDirectory: path.resolve(__dirname, '../.webpack-cache'),
          },
        }
      : {}),
    devtool: dev ? false : 'hidden-source-map',
    resolve: {
      extensions: ['.js', '.ts', '.tsx'],
      alias: {
        ...searchIgnoredStyles(path.resolve(__dirname, '../')),
        ...imageNullLoader(),
        // charts override for the PDF renderer
        '@patternfly/react-charts/dist/js/components/ChartUtils/chart-theme': path.resolve(
          __dirname,
          '../src/moduleOverrides/chart-utils-override.js'
        ),
        // do not consume unfetch from nested dependencies
        unfetch: path.resolve(__dirname, '../src/moduleOverrides/unfetch'),
        '@scalprum/core': path.resolve(__dirname, '../node_modules/@scalprum/core'),
        '@scalprum/react-core': path.resolve(__dirname, '../node_modules/@scalprum/react-core'),
        '@rhds/icons': path.resolve(__dirname, '../node_modules/@rhds/icons'),
      },
      fallback: {
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
        assert: require.resolve('assert/'),
        buffer: require.resolve('buffer/'),
        url: require.resolve('url/'),
        process: require.resolve('process'),
      },
    },
    optimization: {
      minimizer: [new TerserPlugin()],
      concatenateModules: false,
      ...(dev
        ? {
            // for HMR all runtime chunks must be in a single file
            runtimeChunk: 'single',
          }
        : {}),
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
              },
            },
          },
        },
        {
          test: /\.s?[ac]ss$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'resolve-url-loader',
              options: {
                join: createJoinFunction('myJoinFn', createJoinImplementation(PFGenerator)),
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
          test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: plugins(dev, process.env.BETA === 'true', process.env.NODE_ENV === 'restricted'),
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
      // HMR flag
      hot: true,
      ...proxy({
        env: 'stage-beta',
        port: 1337,
        appUrl: [/^\/*$/],
        useProxy: true,
        publicPath,
        proxyVerbose: true,
        isChrome: true,
        routes: {
          ...(process.env.CHROME_SERVICE && {
            // web sockets
            '/wss/chrome-service/': {
              target: `ws://localhost:${process.env.CHROME_SERVICE}`,
              // To upgrade the connection
              ws: true,
            },
            // REST API
            '/api/chrome-service/v1/': {
              host: `http://localhost:${process.env.CHROME_SERVICE}`,
            },
          }),
          ...(process.env.CONFIG_PORT && {
            '/beta/config': {
              host: `http://localhost:${process.env.CONFIG_PORT}`,
            },
            '/config': {
              host: `http://localhost:${process.env.CONFIG_PORT}`,
            },
          }),
          ...(process.env.NAV_CONFIG && {
            '/api/chrome-service/v1/static': {
              host: `http://localhost:${process.env.NAV_CONFIG}`,
            },
          }),
          '/apps/notifications': {
            host: 'http://0.0.0.0:8003',
          },
        },
      }),
    },
  };
};

// PF node module asset compilation config, no need to compile PF assets more than once during a run
/** @type { import("webpack").Configuration } */
const pfConfig = {
  entry: {
    'pf4-v5': path.resolve(__dirname, '../src/sass/pf-5-assets.scss'),
  },
  output: {
    path: path.resolve(__dirname, '../build/js/pf'),
    // the HMR needs dynamic entry filename to remove name conflicts
    filename: '[name].js',
    publicPath: `auto`,
  },
  plugins: [new MiniCssExtractPlugin()],
  stats: {
    errorDetails: true,
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
    cacheDirectory: path.resolve(__dirname, '../.sass-cache'),
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'resolve-url-loader',
            options: {
              join: createJoinFunction('myJoinFn', createJoinImplementation(PFGenerator)),
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                outputStyle: 'compressed',
              },
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
        type: 'asset/resource',
      },
    ],
  },
};

module.exports = function (env) {
  const dev = process.env.DEV_SERVER;
  const config = commonConfig({ dev, publicPath: env.publicPath });
  if (env.analyze === 'true') {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  // bridge between devServer 4 and 5
  // will be useful for RSpack
  if (typeof config.devServer.onBeforeSetupMiddleware !== 'undefined') {
    delete config.devServer.onBeforeSetupMiddleware;
  }

  if (config.devServer.https) {
    delete config.devServer.https;
    config.devServer.server = 'https';
  }

  return [pfConfig, config];
};
