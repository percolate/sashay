var _ = require('lodash')
var BPromise = require('bluebird')
var constants = require('./constants')
var fs = require('fs-extra')
var glob = require('glob')
var path = require('path')
var raml = require('raml-parser')
var refs = require('json-schema-ref-parser')
var validateRamlOutput = require('./validate-raml')

var PRIVATE_CONTENT_RE = /\s*# private[\s\S]*?# endprivate/g
var PRIVATE_TAGS_REG = /# (end)?private/g
var RAML_INCLUDE_RE = /^(?! *#)( *).*( !include (.*(md|raml|json)))$/m
var RAML_INDENT = 2
var RAML_YAML_PATTERN = '/**/*.+(raml|yaml)'

BPromise.promisifyAll(fs)
BPromise.promisifyAll(glob)
BPromise.promisifyAll(refs)

exports.buildJSON = buildJSON
exports.buildRAML = buildRAML
exports.normalize = normalize

function normalize (options) {
    if (!options.tmpDir) options.tmpDir = constants.tmpDir
    return BPromise.resolve()
        .then(cleanupTemp.bind(undefined, options))
        .then(copySourcesToTemp.bind(undefined, options))
        .then(filterPublic.bind(undefined, options))
        .then(convertYamlToJson.bind(undefined, options))
}

function buildRAML (options) {
    return BPromise.resolve()
        .then(function () {
            return dereferenceRAML(getTmpRAML(options), 0)
        })
}
function buildJSON (options) {
    return BPromise.resolve()
        .then(function () {
            return raml.loadFile(getTmpRAML(options))
        }).then(function (json) {
            if (options.validate) validateRamlOutput(json)
            return json
        })
}

function copySourcesToTemp (options) {
    return fs.copyAsync(path.dirname(options.source), options.tmpDir)
}

function getTmpRAML (options) {
    return path.resolve(options.tmpDir, path.basename(options.source))
}

function cleanupTemp (options) {
    return fs.removeAsync(options.tmpDir)
}

function dereferenceRAML (file, parentIndent) {
    var content = fs.readFileSync(file, 'utf8')
    var matches = content.match(RAML_INCLUDE_RE)

    // matches:
    // 0.line:      '    content: !include docs/foo.md',
    // 1.indent:    '    ',
    // 2.include:   ' !include docs/foo.md',
    // 3.path:      'docs/foo.md',
    // 4.extension: 'md',
    while (matches) {
        var extension = matches[4]
        var includePath = path.resolve(path.dirname(file), matches[3])
        var includeValue = matches[2]
        var indent = matches[1].length + RAML_INDENT
        var replaceWith = (extension !== 'raml') ? ' |\n' : '\n'

        replaceWith += dereferenceRAML(includePath, indent)
        content = content.replace(includeValue, replaceWith)
        matches = content.match(RAML_INCLUDE_RE)
    }

    return parentIndent === 0 ? content : _.chain(content)
        .replace('---\n', '')
        .trimEnd('\n')
        .split('\n')
        .map(function (line) {
            return line.length ? _.repeat(' ', parentIndent) + line : ''
        })
        .join('\n')
        .value()
}

function convertYamlToJson (options) {
    return BPromise.resolve()
        .then(getFiles.bind(undefined, options, constants.dereferenceGlobPattern))
        .map(function (file) {
            return refs.dereferenceAsync(file).then(function (schema) {
                return fs.writeFileAsync(
                    // replace .yaml to .json
                    file.replace(path.extname(file), '.json'),
                    JSON.stringify(schema, undefined, 2)
                )
            })
        })
}

function getFiles (options, pattern) {
    return glob.globAsync(pattern, {
        root: options.tmpDir,
    })
}

function filterPublic (options) {
    if (!options.publicOnly) return BPromise.resolve()
    return BPromise.resolve()
        .then(getFiles.bind(undefined, options, RAML_YAML_PATTERN))
        .map(function (file) {
            return fs.readFileAsync(file, 'utf-8')
                .then(function (content) {
                    if (!content.match(PRIVATE_TAGS_REG)) return BPromise.resolve()
                    return fs.writeFileAsync(file, content.replace(PRIVATE_CONTENT_RE, ''))
                })
        })
}
