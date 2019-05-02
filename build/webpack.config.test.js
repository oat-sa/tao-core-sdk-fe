const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = () => ({
    entry: {
        'test.built': path.resolve(__dirname, '..', 'test', 'core', 'requireIfExists', 'test.js')
    },
    mode: 'development',
    output: {
        path: path.resolve(__dirname, '..', 'dist')
    },
    externals: [
        'lib/polyfill/es6-promise'
    ],
    module: {
        rules: [
            {
                test: /qunit/,
                use: [{ loader: 'file-loader' }],
              },
        ]
    },
    plugins: [
            new HtmlWebpackPlugin({
                filename: 'test.html',
                template: path.resolve(__dirname, '..', 'test', 'core', 'requireIfExists', 'test.html'),
                inject: false
            })
    ],
    resolve: {
        alias: {
            core: path.resolve(__dirname, '..', 'src', 'core')
        }
    },
    devServer: {
        contentBase: path.resolve(__dirname, '..', 'dist'),
        watchContentBase: true,
        compress: false,
        publicPath: '/',
        hot: false,
        host: '0.0.0.0',
        disableHostCheck: true
    }
});