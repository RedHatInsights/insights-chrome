const merge = require('webpack-merge');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
.BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');

const commonConfig = {
    entry: path.resolve(__dirname, '../src/js/chrome.js'),
    output: {
        path: path.resolve(__dirname, '../build/js'),
        filename: 'chrome.js',
        publicPath: '/apps/chrome/js/',
        chunkFilename: '[name].[hash].js'
    },
    externals: {
        '@patternfly/react-table': {
            commonjs: '@patternfly/react-table',
            commonjs2: '@patternfly/react-table',
            amd: '@patternfly/react-table',
            root: 'PFReactTable'
        },
        'react-router-dom': 'react-router-dom',
        graphql: 'graphql'
    },
    optimization: {
        minimize: true,
        concatenateModules: false
    },
    module: {
        rules: [
            {
                test: /src\/.*\.js$/,
                exclude: /node_modules/,
                use: [{ loader: 'source-map-loader' }, { loader: 'babel-loader' }]
            },
            {
                test: /\.s?[ac]ss$/,
                use: ['css-loader', 'sass-loader']
            },
            {
                test: /\.(jpg|png|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            },
            {
                parser: {
                    amd: false
                }
            }
        ]
    },
    plugins
};

const devConfig = {
    devServer: {
        contentBase: path.join(__dirname, '../dist'),
        port: 8002,
        https: true,
        historyApiFallback: true,
        hot: false,
        inline: false,
        disableHostCheck: true
    }
};

module.exports = function(env) {
    const common = commonConfig;
    if (env.analyze === 'true') {
        common.plugins.push(new BundleAnalyzerPlugin());
    }

    if (env.prod === 'true') {
        return common;
    }

    return merge(common, devConfig);
};
