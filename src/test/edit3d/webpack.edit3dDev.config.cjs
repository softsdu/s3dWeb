const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/test/edit3d/js/edit3d.js',
    output: {
        path: path.join(__dirname, '../../../dist/edit3dDev'),
        filename: 'test/edit3d/js/edit3d.js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns:[
                {from: "src/test/edit3d/pages", to: "test/edit3d/pages"},
                {from: "src/test/edit3d/resources", to: "test/edit3d/resources"},
                {from: "src/test/edit3d/models", to: "test/edit3d/models"},
                {from: "src/test/edit3d/favicon.ico", to: "favicon.ico"},
                {from: "src/images", to: "images"}
            ]
        }),
    ],
    devServer: {
        host: "localhost",
        port: 8082,
        open: {
            target: ['test/edit3d/pages/edit3d.html']
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