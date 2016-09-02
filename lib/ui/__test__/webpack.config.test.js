var resolve = require('path').resolve
var webpack = require('webpack')

module.exports = {
    context: __dirname,
    devtool: 'eval',
    entry: {
        app: './entry.js',
    },
    externals: {
        'react/addons': 'window',
        'react/lib/ExecutionEnvironment': true,
        'react/lib/ReactContext': 'window',
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
                loader: 'style!css!less',
            },
            {
                test: [
                    /\.png$/,
                    /\.woff$/,
                ],
                loader: 'file',
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('test'),
            },
        }),
    ],
    resolve: {
        root: resolve(__dirname, '../'),
    },
}
