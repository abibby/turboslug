const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const paths = {
    src: path.resolve(__dirname, 'src'),
    js: path.resolve(__dirname, 'src/js'),
    dist: path.resolve(__dirname, 'dist'),
}

const devMode = true

module.exports = {
    entry: path.join(paths.js, 'index.tsx'),
    mode: devMode ? 'development' : 'production',
    devtool: devMode ? 'source-map' : '',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: [
                    'ts-loader',
                    'tslint-loader',
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            plugins: [
                                require("css-mqpacker")({ sort: true }),
                                require('autoprefixer'),
                            ]
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                            includePaths: [
                                'node_modules', 'src', '.'
                            ]
                        }
                    },
                ],
            },
        ]
    },
    output: {
        path: paths.dist,
        filename: './' + (devMode ? '[name].js' : '[name].[hash].js'),
        chunkFilename: './' + (devMode ? '[id].js' : '[id].[hash].js'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.scss', '.css'],
        modules: [
            "node_modules",
            paths.src,
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(paths.src, 'index.html'),
            filename: "index.html",
        }),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: './' + (devMode ? '[name].css' : '[name].[hash].css'),
            chunkFilename: './' + (devMode ? '[id].css' : '[id].[hash].css'),
        }),
    ],
};