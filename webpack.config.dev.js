var path = require('path')
var webpack = require('webpack')

module.exports = {
    context: path.resolve(__dirname, './lib/ui/'),
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
                loader: 'jsx-loader',
            },
            {
                test: /\.less$/,
                loader: 'style!css!less',
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
            }
        }),
    ],
}
