const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
.BundleAnalyzerPlugin;
const plugins = require('./webpack.plugins.js');

const commonConfig = ({
    publicPath,
    noHash
}) => ({
    entry: path.resolve(__dirname, '../src/js/chrome.js'),
    output: {
        path: path.resolve(__dirname, '../build/js'),
        filename: `chrome${noHash ? '' : '.[chunkhash]'}.js`,
        publicPath,
        chunkFilename: '[name].[chunkhash].js',
        jsonpFunction: 'wpJsonpChromeInstance'
    },
    resolve: {
        alias: {
            PFReactTable: path.resolve(__dirname, './patternfly-table-externals.js'),
            customReact: path.resolve(__dirname, './react-external.js'),
            reactRedux: path.resolve(__dirname, './react-redux-external.js'),
            'react-router-dom': path.resolve(__dirname, './react-router-dom-externals.js'),
            PFReactCore: path.resolve(__dirname, './patternfly-react-externals.js')
        }
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
                use: ['style-loader', 'css-loader', 'sass-loader']
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
});

module.exports = function(env) {
    const config = commonConfig({ publicPath: env.publicPath, noHash: env.noHash === 'true' });
    if (env.analyze === 'true') {
        config.plugins.push(new BundleAnalyzerPlugin());
    }

    return config;
};
