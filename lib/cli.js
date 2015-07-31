/*eslint no-process-exit:0 */
var _ = require('lodash')
var commander = require('commander')
var lib = require('./')

commander
    .command('build [schema]')
    .description('Builds the documentation')
    .option('--destination [destination]', 'the output destination')
    .option('--extension [extension]', 'extends the output with additional markdown documentation')
    .option('--filename [filename]', 'the output filename')
    .option('--filter [tags]', 'filters the operations by tag', function (val) { return val.split(',') })
    .option('--watch', 'should watch files and rebuild')
    .action(build)

commander.parse(process.argv)

function build (schema, options) {
    lib.build(merge(schema, options)).caught(function (err) {
        console.error(err.stack)
        process.exit(1)
    })
}

function merge (schema, options) {
    options = _.pick.apply(_, [options].concat([
        'destination',
        'extension',
        'filename',
        'filter',
        'watch',
    ]))
    return _.extend(options, {
        schema: schema,
    })
}
