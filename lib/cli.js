/* eslint no-process-exit:0 */
var _ = require('lodash')
var commander = require('commander')
var lib = require('./')

var input = ''

process.stdin.on('data', function (chunk) {
    input += chunk
})

process.stdin.on('end', function () {
    commander.parse(process.argv)
})

commander
    .command('build')
    .description('builds the website')
    .option('--destination [dir]', 'the output destination')
    .option('--dev', 'start the development server')
    .option('--filename [filename]', 'the output filename')
    .option('--filter [tags]', 'filters the operations by tag', function (tags) { return JSON.parse(tags) })
    .option('--preview', 'start the preview server')
    .action(function (options) {
        options = _.pick.apply(_, [options].concat([
            'destination',
            'dev',
            'filename',
            'filter',
            'preview',
        ]))
        _.extend(options, {
            input: JSON.parse(input),
        })
        lib.build(options)
            .caught(function (err) {
                console.error(err.stack)
                process.exit(1)
            })
    })

commander
    .command('template')
    .description('renders the template')
    .option('--destination [dir]', 'the output destination')
    .option('--filename [filename]', 'the output filename')
    .option('--filter [tags]', 'filters the operations by tag', function (val) { return val.split(',') })
    .option('--template [file]', 'the template')
    .action(function (options) {
        options = _.pick.apply(_, [options].concat([
            'destination',
            'filename',
            'filter',
            'template',
            'watch',
        ]))
        _.extend(options, {
            input: JSON.parse(input),
        })
        lib.template(options)
            .then(function (output) {
                process.stdout.write(output)
            })
            .caught(function (err) {
                console.error(err.stack)
                process.exit(1)
            })
    })
