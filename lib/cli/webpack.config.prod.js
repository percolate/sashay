var ExtractTextPlugin = require('extract-text-webpack-plugin')
var webpack = require('webpack')

module.exports = {
    context: __dirname,
    devtool: 'source-map',
    entry: {
        app: './entry',
    },
    module: {
        loaders: [
            {
                test: require.resolve('react'),
                loader: 'expose?React',
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                test: /\.jsx$/,
                loader: 'babel-loader',
                query: {
                    cacheDirectory: true,
                    presets: [
                        'es2015',
                        'react',
                    ],
                },
            },
            {
                test: /\.less$/,
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader'),
            },
            {
                test: /\.png$/,
                loader: 'url',
            },
        ],
    },
    node: {
        dns: 'empty',
        net: 'empty',
    },
    output: {
        filename: '[name].js',
        library: 'app',
        libraryTarget: 'var',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
                PLATFORM: JSON.stringify('browser'),
            },
        }),
        new ExtractTextPlugin('[name].css', {
            allChunks: true,
        }),
    ],
}