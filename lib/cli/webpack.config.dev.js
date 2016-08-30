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
                loader: 'json',
            },
            {
                test: /\.jsx$/,
                loader: 'babel-loader',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015', 'react'],
                },
            },
            {
                test: /\.less$/,
                loader: 'style!css!less',
            },
            {
                test: /\.woff$/,
                loader: 'file-loader',
                query: {
                    name: 'font/[name].[hash].[ext]',
                },
            },
            {
                test: /\.png$/,
                loader: 'file-loader',
                query: {
                    name: 'img/[name].[hash].[ext]',
                },
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
                NODE_ENV: JSON.stringify('development'),
                PLATFORM: JSON.stringify('browser'),
            },
        }),
    ],
}
