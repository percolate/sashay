var resolve = require('path').resolve

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
    mode: 'development',
    module: {
        rules: [
            {
                test: require.resolve('react'),
                use: [{ loader: 'expose-loader', options: 'React' }],
            },
            {
                test: /\.jsx$/,
                loader: 'babel-loader',
                options: { babelrc: true },
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
            },
            {
                test: [/\.png$/, /\.woff$/],
                loader: 'file-loader',
            },
        ],
    },
    resolve: {
        modules: [resolve(__dirname, '..'), 'node_modules'],
    },
}
