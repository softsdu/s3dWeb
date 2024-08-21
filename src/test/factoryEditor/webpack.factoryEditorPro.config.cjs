const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: './src/test/factoryEditor/js/factoryEditor.js',
    output: {
        path: path.join(__dirname, '../../../dist/factoryEditorPro'),
        filename: 'test/factoryEditor/js/factoryEditor.js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns:[
                {from: "src/test/factoryEditor/pages", to: "test/factoryEditor/pages"},
                {from: "src/test/factoryEditor/resources", to: "test/factoryEditor/resources"},
                {from: "src/test/factoryEditor/models", to: "test/factoryEditor/models"},
                {from: "src/test/factoryEditor/favicon.ico", to: "favicon.ico"},
                {from: "src/images", to: "images"}
            ]
        }),
    ],
    devServer: {
        host: "127.0.0.1",
        port: 8082,
        open: {
            target: ['test/factoryEditor/pages/factoryEditor.html']
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