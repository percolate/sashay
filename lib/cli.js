/* eslint no-process-exit:0 */
var _ = require('lodash')
var BPromise = require('bluebird')
var commander = require('commander')
var lib = require('./')
var path = require('path')

commander
    .option('-d, --destination [dir]', 'The build directory. Default `./build/`.')
    .option('-o, --output [format]', 'The output format. Must be `json` or `web`. Default `json`.')
    .option('-q, --quiet', 'Set to suppress logs.')
    .option('-w, --watch', 'Set to watch files for changes and rebuild. In `web` mode, starts a preview server at http://127.0.0.1:8000/.')

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
