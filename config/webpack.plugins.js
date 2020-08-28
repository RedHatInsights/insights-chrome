const webpack = require('webpack');
const LodashWebpackPlugin = require('lodash-webpack-plugin');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const plugins = [
    new CleanWebpackPlugin(),
    new WriteFileWebpackPlugin(),
    new webpack.SourceMapDevToolPlugin({
        test: /\.js/i,
        exclude: /node_modules/i,
        filename: `sourcemaps/[name].js.map`
    }),
    new LodashWebpackPlugin({
        currying: true,
        flattening: true,
        placeholders: true,
        paths: true
    })
];

module.exports = plugins;
