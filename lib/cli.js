/* eslint no-process-exit:0 */
var _ = require('lodash')
var BPromise = require('bluebird')
var commander = require('commander')
var lib = require('./')
var path = require('path')

var file

commander
    .option('-d, --destination [dir]', 'The build directory. Default `./build/`.')
    .option('-f, --filter [filter]', 'Filters resources that have `#YOUR_FILTER` in the description. Must be `public` or undefined.')
    .option('-o, --output [format]', 'The output format. Must be `json`, `raml`, or `web`. Default `json`.')
    .option('-q, --quiet', 'Set to suppress logs.')
    .option('-w, --watch', 'Set to watch files for changes and rebuild. In `web` mode, starts a preview server at http://127.0.0.1:8000/.')

commander
    .usage('[options] <file>')
    .action(function (_file, options) {
        file = _file
        BPromise.resolve()
            .then(function () {
                return lib(normalizeArgs(file, options))
            })
            .caught(handleError)
    })

commander.parse(process.argv)

if (_.isEmpty(file)) handleError(new Error('Must specify <file>, e.g. `v5/index.raml`'))

function handleError (err) {
    console.error(err.stack || err)
    process.exit(1)
}

function normalizeArgs (source, options) {
    return _.chain(options)
        .pick([
            'destination',
            'filter',
            'output',
            'quiet',
            'watch',
        ])
        .extend({
            source: source,
        })
        .mapValues(function (val, key) {
            if (!_.includes([
                'destination',
                'source',
            ], key)) return val
            return path.resolve(process.cwd(), val)
        })
        .value()
}
