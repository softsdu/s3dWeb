const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/test/auto/js/auto.js',
    output: {
        path: path.join(__dirname, '../../../dist/autoDev'),
        filename: 'test/auto/js/auto.js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns:[
                {from: "src/test/auto/pages", to: "test/auto/pages"},
                {from: "src/test/auto/models", to: "test/auto/models"},
                {from: "src/test/auto/resources", to: "test/auto/resources"},
                {from: "src/test/auto/favicon.ico", to: "favicon.ico"},
                {from: "src/images", to: "images"}
            ]
        }),
    ],
    devServer: {
        host: "127.0.0.1",
        port: 8082,
        open: {
            target: ['test/auto/pages/auto.html']
        },
        compress: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader',{
                    loader: 'css-loader',
                    options: {
                        url: false, // 禁用处理 url
                    },
                }],
            },
        ],
    },
    performance:{
        hints:false
    },
}