/* eslint global-require: 0, no-process-env: 0 */
var commander = require('commander')
var Joi = require('joi')
var map = require('lodash/map')
var merge = require('lodash/merge')
var pick = require('lodash/pick')
var testWebpackConfig = require('./webpack.config.test')

var MODES = {
    coverage: {
        id: 'coverage',
    },
    dev: {
        id: 'dev',
    },
    test: {
        id: 'test',
    },
}
var options = Joi.attempt(
    pick(commander.option('--mode [mode]').parse(process.argv), ['mode']),
    Joi.object().keys({
        mode: Joi.string()
            .valid(map(MODES, 'id'))
            .default(MODES.test.id),
    })
)

module.exports = function(config) {
    var override
    switch (options.mode) {
        case MODES.coverage.id:
            override = {
                coverageIstanbulReporter: {
                    reports: ['text', 'lcov'],
                    fixWebpackSourcePaths: true,
                    'report-config': {
                        lcov: {
                            dir: '../coverage/',
                            subdir: './lcov/',
                        },
                    },
                },
                reporters: ['coverage-istanbul'],
                singleRun: true,
                webpack: require('./webpack.config.coverage'),
            }
            break
        case MODES.dev.id:
            override = {
                browsers: ['Chrome'],
                singleRun: false,
                webpack: require('./webpack.config.test-dev'),
            }
            break
    }
    config.set(
        merge(
            {
                browsers: [
                    process.env.CI
                        ? 'ChromeHeadlessNoSandbox'
                        : 'ChromeHeadless',
                ],
                customLaunchers: {
                    ChromeHeadlessNoSandbox: {
                        base: 'ChromeHeadless',
                        flags: ['--no-sandbox'],
                    },
                },
                client: {
                    mocha: {
                        reporter: 'html',
                    },
                },
                colors: true,
                files: ['./entry.js'],
                frameworks: ['mocha', 'sinon'],
                logLevel: config.LOG_INFO,
                plugins: [
                    'karma-chai',
                    'karma-chrome-launcher',
                    'karma-coverage-istanbul-reporter',
                    'karma-mocha',
                    'karma-sinon',
                    'karma-sourcemap-loader',
                    'karma-webpack',
                ],
                port: 9876,
                preprocessors: {
                    './entry.js': ['webpack', 'sourcemap'],
                },
                reporters: ['progress'],
                singleRun: true,
                webpack: testWebpackConfig,
                webpackMiddleware: {
                    noInfo: true,
                },
            },
            override
        )
    )
}
