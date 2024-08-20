const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/test/house2dEditor/js/house2dEditor.js',
    output: {
        path: path.join(__dirname, '../../../dist/house2dEditor'),
        filename: 'test/house2dEditor/js/house2dEditor.js'
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns:[
                {from: "src/test/house2dEditor/pages", to: "test/house2dEditor/pages"},
                {from: "src/test/house2dEditor/resources", to: "test/house2dEditor/resources"},
                {from: "src/test/house2dEditor/images", to: "test/house2dEditor/images"},
                {from: "src/test/house2dEditor/favicon.ico", to: "favicon.ico"},
                {from: "src/images", to: "images"}
            ]
        }),
    ],
    devServer: {
        host: "127.0.0.1",
        port: 8082,
        open: {
            target: ['applications/house2dEditor/pages/house2dEditor.html']
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
                use: [{
                    loader: 'style-loader'
                },{
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