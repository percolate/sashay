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

module.exports = buildJSON
module.exports.buildRAML = buildRAML

function prepareRAML (options) {
    if (!options.tmpDir) options.tmpDir = constants.tmpDir
    return BPromise.resolve()
        .then(copySourcesToTemp.bind(undefined, options))
        .then(filterRamlOutput.bind(undefined, options))
        .then(getFiles.bind(undefined, options, constants.dereferenceGlobPattern))
        .then(dereferenceJSON.bind(undefined, options))
        .then(writeTemp)
}

function buildRAML (options) {
    return BPromise.resolve()
        .then(prepareRAML.bind(undefined, options))
        .then(function () {
            var source = getTmpRAML(options)
            return dereferenceRAML(source, 0)
        })
        .then(function (dereferencedRAML) {
            var destination = path.resolve(options.destination, 'index.raml')
            if (!options.quiet) console.log(`Building to ${destination}`)
            return fs.outputFileAsync(destination, dereferencedRAML)
        })
        .finally(cleanupTemp.bind(undefined, options))
}

function buildJSON (options) {
    return BPromise.resolve()
        .then(prepareRAML.bind(undefined, options))
        .then(function () {
            return raml.loadFile(getTmpRAML(options))
        })
        .then(validateRamlOutput)
        .finally(cleanupTemp.bind(undefined, options))
}

function copySourcesToTemp (options) {
    return fs.copyAsync(path.dirname(options.source), options.tmpDir)
}

function getTmpRAML (options) {
    return path.resolve(options.tmpDir, path.basename(options.source))
}

function cleanupTemp (options) {
    fs.removeSync(options.tmpDir)
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

function dereferenceJSON (options, files) {
    return BPromise.all(files.map(function (file) {
        return refs.dereferenceAsync(file)
    }))
    .then(function (schemas) {
        return _.zipObject(files, schemas)
    })
}

function getFiles (options, pattern) {
    return glob.globAsync(pattern, {
        root: options.tmpDir,
    })
}

function filterRamlOutput (options) {
    return BPromise.resolve()
        .then(getFiles.bind(undefined, options, RAML_YAML_PATTERN))
        .each(function (file) {
            return fs.readFileAsync(file, 'utf-8')
                .then(function (content) {
                    var match = content.match(PRIVATE_TAGS_REG)
                    if (!match) return BPromise.resolve()

                    var regex = options.publicOnly ? PRIVATE_CONTENT_RE : PRIVATE_TAGS_REG
                    return fs.writeFile(file, content.replace(regex, ''))
                })
        })
}

function writeTemp (schemaMap) {
    return _.chain(schemaMap)
        .map(function (schema, sourcePath) {
            return [
                sourcePath,
                {
                    tempPath: sourcePath.replace(path.extname(sourcePath), '.json'),
                    schema: schema,
                },
            ]
        })
        .fromPairs()
        .forEach(function (obj) {
            fs.writeFileSync(obj.tempPath, JSON.stringify(obj.schema, undefined, 2))
        })
        .value()
}
