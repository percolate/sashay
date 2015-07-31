var fs = require('fs-extra')
var Handlebars = require('handlebars')
var parser = require('./parser')
var path = require('path')
var Watchpack = require('watchpack')

var LAYOUT_PATH = path.resolve(__dirname, './templates/layout.hbs')
var NEWLINES_RE = /(\n){2,}/g

exports.build = build
exports.watch = watch

function build (options) {
    return parser.parse(options)
        .then(function (data) {
            var template = Handlebars.compile(fs.readFileSync(LAYOUT_PATH, 'utf8'))
            var markdown = template(data).replace(NEWLINES_RE, '\n\n')
            fs.ensureDirSync(options.destination)
            fs.writeFileSync(path.resolve(options.destination, './', options.filename), markdown)
        })
}

function watch (options) {
    var watchpack = new Watchpack()
    var files = [
        options.schema,
    ]
    if (options.extension) files.push(options.extension)
    var dirs = [
        path.resolve(__dirname, './templates/'),
    ]
    watchpack.on('aggregated', function () {
        build(options)
    })
    watchpack.watch(files, dirs)
}
