var merge = require('lodash/merge')
var testConfig = require('./webpack.config.test')
var webpack = require('webpack')

module.exports = merge(testConfig, {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('development'),
            },
        }),
    ],
})
