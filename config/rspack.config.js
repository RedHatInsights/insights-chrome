/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const rspack = require('@rspack/core');
const plugins = require('./rspack.plugins.js');
const { createJoinFunction, createJoinImplementation, asGenerator, defaultJoinGenerator } = require('resolve-url-loader');
const searchIgnoredStyles = require('@redhat-cloud-services/frontend-components-config-utilities/search-ignored-styles');
const proxy = require('@redhat-cloud-services/frontend-components-config-utilities/proxy');
const imageNullLoader = require('./image-null-loader.js');

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
  /** @type { import("@rspack/core").Configuration["devServer"] } */
  const pc = proxy({
    env: 'stage-beta',
    port: 1337,
    appUrl: [/^\/*$/],
    useProxy: true,
    publicPath,
    proxyVerbose: true,
    isChrome: true,
    routes: {
      // '/apps/landing': {
      //   host: 'http://localhost:8888',
      // },
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
    },
  });
  // console.log(pc.onBeforeSetupMiddleware);
  pc.setupMiddlewares = (middlewares, { app, compiler, options }) => {
    app.enable('strict routing');

    return middlewares;
  };
  // not in v1 release
  delete pc.onBeforeSetupMiddleware;

  /** @type { import("rspack").Configuration } */
  return {
    entry: dev
      ? // HMR request react, react-dom and react-refresh/runtime to be in the same chunk
        {
          main: path.resolve(__dirname, '../src/index.ts'),
          // vendors: ['react', 'react-dom', 'react-refresh/runtime'],
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
          cache: true,
        }
      : {}),
    devtool: false,
    experiments: {
      css: true,
      // lazyCompilation: true,
      // rspackFuture: {
      //   disableTransformByDefault: true,
      // },
    },
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
        // this is critical to froce MFE plugin to pick the correct version of react
        react: path.resolve(__dirname, '../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
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
      concatenateModules: false,
      ...(dev
        ? {
            // for HMR all runtime chunks must be in a single file
            // runtimeChunk: 'single',
          }
        : {}),
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              transform: {
                react: {
                  runtime: 'automatic',
                  development: dev,
                  refresh: dev,
                },
              },
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
                api: 'modern-compiler',
                implementation: require.resolve('sass-embedded'),
              },
            },
          ],
          type: 'css/auto',
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
      server: 'https',
      port: 1337,
      // HMR flag
      ...pc,
      hot: true,
    },
  };
};

// PF node module asset compilation config, no need to compile PF assets more than once during a run
/** @type { import("rspack").Configuration } */
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
  plugins: [new rspack.CssExtractRspackPlugin()],
  stats: {
    errorDetails: true,
  },
  cache: true,
  experiments: {
    css: true,
  },
  module: {
    rules: [
      {
        test: /\.s?[ac]ss$/,
        use: [
          // rspack.CssExtractRspackPlugin.loader,
          // 'css-loader',
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
              api: 'modern-compiler',
              implementation: require.resolve('sass-embedded'),
            },
          },
        ],
        type: 'css/auto',
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

  return [pfConfig, config];
};