const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/test/scene3dEditor/js/scene3dEditor.js',
    output: {
        path: path.join(__dirname, '../../../dist/scene3dEditorDev'),
        filename: 'test/scene3dEditor/js/scene3dEditor.js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns:[
                {from: "src/test/scene3dEditor/pages", to: "test/scene3dEditor/pages"},
                {from: "src/test/scene3dEditor/resources", to: "test/scene3dEditor/resources"},
                {from: "src/test/scene3dEditor/favicon.ico", to: "favicon.ico"},
                {from: "src/images", to: "images"}
            ]
        }),
    ],
    devServer: {
        host: "127.0.0.1",
        port: 8082,
        open: {
            target: ['test/scene3dEditor/pages/scene3dEditor.html']
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