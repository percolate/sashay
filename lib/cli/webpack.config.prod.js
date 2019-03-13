var MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
    context: __dirname,
    devtool: 'source-map',
    entry: {
        app: './entry',
    },
    mode: 'production',
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
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
            },
            {
                test: /\.woff$/,
                loader: 'file-loader',
                options: {
                    name: 'font/[name].[hash].[ext]',
                },
            },
            {
                test: /\.png$/,
                loader: 'file-loader',
                options: {
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
    plugins: [new MiniCssExtractPlugin()],
}
