var merge = require('lodash/merge')
var testConfig = require('./webpack.config.test')

module.exports = merge(testConfig, {
    devtool: undefined,
    module: {
        rules: [
            {
                test: [/.*.js$/, /.*.jsx$/],
                include: [/\/ui\//],
                exclude: [/\/node_modules\//, /\/__test__\//, /\/env.js$/],
                use: 'istanbul-instrumenter-loader',
                enforce: 'post',
            },
        ],
    },
})
