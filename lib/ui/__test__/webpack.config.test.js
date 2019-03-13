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
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react'],
                },
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
