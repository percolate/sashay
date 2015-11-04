/* eslint no-process-exit:0 */
var _ = require('lodash')
var BPromise = require('bluebird')
var commander = require('commander')
var lib = require('./')
var path = require('path')

commander
    .option('-d, --destination [dir]', 'specify build destination')
    .option('-o, --output [format]', 'specify the output format')
    .option('-q, --quiet')
    .option('-w, --watch')

commander
    .usage('[options] <source>')
    .action(function (source, options) {
        BPromise.resolve()
            .then(function () {
                return lib(normalizeArgs(source, options))
            })
            .caught(handleError)
    })

commander.parse(process.argv)

function handleError (err) {
    console.error(err.stack || err)
    process.exit(1)
}

function normalizeArgs (source, options) {
    return _.chain(options)
        .pick([
            'destination',
            'output',
            'quiet',
            'watch',
        ])
        .extend({
            source: source,
        })
        .mapValues(function (val, key) {
            if (!_.contains([
                'destination',
                'source',
            ], key)) return val
            return path.resolve(process.cwd(), val)
        })
        .value()
}
