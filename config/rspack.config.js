/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const rspack = require('@rspack/core');
const { defineConfig } = require('@rspack/cli');
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
  // not in v1 release
  delete pc.onBeforeSetupMiddleware;

  /** @type { import("rspack").Configuration } */
  return defineConfig({
    entry: {
      main: path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
      uniqueName: 'chrome-root',
      path: path.resolve(__dirname, '../build/js'),
      ...(!dev
        ? {
            filename: 'chrome-root.[contenthash].js',
            hashFunction: 'xxhash64',
            chunkFilename: '[name].[contenthash].js',
          }
        : {}),
      publicPath,
    },
    // cache: true,
    devtool: dev ? false : 'hidden-source-map',
    experiments: {
      css: true,
    },
    resolve: {
      extensions: ['...', '.js', '.ts', '.tsx'],
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
        stream: require.resolve('stream-browserify'),
        zlib: require.resolve('browserify-zlib'),
      },
    },
    optimization: {
      concatenateModules: false,
      minimizer: [new rspack.SwcJsMinimizerRspackPlugin(), new rspack.LightningCssMinimizerRspackPlugin()],
      ...(dev && {
        runtimeChunk: 'single',
      }),
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)x?$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    development: !!dev,
                    refresh: !!dev,
                  },
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
          type: 'asset',
        },
      ],
    },
    plugins: plugins(dev, process.env.BETA === 'true', process.env.NODE_ENV === 'restricted'),
    devServer: {
      // HMR flag
      ...pc,
      client: {
        overlay: false,
      },
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
      liveReload: true,
    },
  });
};

module.exports = function (env) {
  const dev = process.env.DEV_SERVER;
  const config = commonConfig({ dev, publicPath: env.publicPath });

  return config;
};
