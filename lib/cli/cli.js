/* eslint no-process-exit:0 */
var _ = require('lodash')
var BPromise = require('bluebird')
var build = require('./build')
var commander = require('commander')
var fs = require('fs')
var path = require('path')

var file

function collect(val, memo) {
    memo.push(val)
    return memo
}

commander
    .option(
        '-d, --destination [dir]',
        'The build directory. Default `./build/`.'
    )
    .option(
        '-p, --public-only',
        'Filter out content between `# private` and `# endprivate`'
    )
    .option(
        '-o, --output [format]',
        'A list of output formats. Must be `json`, `raml`, or `web`. Defaults [`json`].',
        collect,
        []
    )
    .option('-q, --quiet', 'Set to suppress logs.')
    .option(
        '-w, --watch',
        'Set to watch files for changes and rebuild. In `web` mode, starts a preview server at http://127.0.0.1:8000/.'
    )
    .option(
        '-t, --tmp-dir [dir]',
        'Pass a temp directory for file manipulation. Defaults to `./tmp/`.'
    )
    .option('--no-validate', 'Skip schema validation')

commander.usage('[options] <file>').action(function(_file, options) {
    file = _file
    BPromise.resolve()
        .then(function() {
            return build(normalizeArgs(file, options))
        })
        .caught(handleError)
})

commander.parse(process.argv)

var isFile
try {
    isFile = fs.statSync(file).isFile()
} catch (e) {
    isFile = false
}
if (!isFile) handleError(new Error('Must specify <file>, e.g. `v5/index.raml`'))

function handleError(err) {
    console.error(err.stack || err)
    process.exit(1)
}

function normalizeArgs(source, options) {
    return _.chain(options)
        .pick([
            'destination',
            'output',
            'publicOnly',
            'quiet',
            'watch',
            'tmpDir',
            'validate',
        ])
        .extend({
            source: source,
        })
        .mapValues(function(val, key) {
            // remove output when empty to force default value
            if (key === 'output' && val.length === 0) return undefined
            if (!_.includes(['destination', 'source'], key)) return val
            return path.resolve(process.cwd(), val)
        })
        .value()
}
