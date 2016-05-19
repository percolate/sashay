var _ = require('lodash')
var ajv = require('ajv')()
var BPromise = require('bluebird')
var constants = require('./constants')
var fs = require('fs-extra')
var glob = require('glob')
var helper = require('./helper')
var Joi = require('joi')
var path = require('path')
var raml = require('raml-parser')
var refs = require('json-schema-ref-parser')
var util = require('util')

var INVALID_RAML = 'Invalid RAML'
var INVALID_RESPONSE_EXAMPLE = 'Example response does not validate against schema'
var INVALID_REQUEST_EXAMPLE = 'Example request does not validate against schema'
var PRIVATE_CONTENT_RE = /\s*# private[\s\S]*?# endprivate/g
var PRIVATE_TAGS_REG = /# (end)?private/g
var RAML_INCLUDE_RE = /( *).*( !include (.*(md|raml|json)))/m
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
        .then(dereferenceJSON)
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

function dereferenceJSON (files) {
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

function getPathSegmentsError (pathSegments, message, type) {
    type = type || 'Error'
    var separator = '.'
    return new Error(util.format('%s at "%s": %s', type, separator + pathSegments.join(separator), message))
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

function validateRamlOutput (obj) {
    var validation = Joi.validate(obj, Joi.object().keys({
        baseUri: Joi.string().required(),
        resources: Joi.array().items(Joi.object()).required(),
        title: Joi.string().required(),
        version: Joi.string().required(),
    }), { allowUnknown: true })
    if (validation.error) throw getPathSegmentsError([], validation.error.message, INVALID_RAML)
    obj.resources.forEach(validateRootResource)
    return obj
}

function validateRootResource (obj) {
    var validation = Joi.validate(obj, Joi.object().keys({
        displayName: Joi.string().required(),
    }), { allowUnknown: true })
    if (validation.error) throw getPathSegmentsError(obj.relativeUriPathSegments, validation.error.message, INVALID_RAML)
    if (!_.isEmpty(obj.methods)) obj.methods.forEach(validateMethod.bind(undefined, obj.relativeUriPathSegments))
    if (!_.isEmpty(obj.resources)) obj.resources.forEach(validateResource.bind(undefined, obj.relativeUriPathSegments))
}

function validateResource (relativeUriPathSegments, obj) {
    if (!_.isEmpty(obj.methods)) obj.methods.forEach(validateMethod.bind(undefined, relativeUriPathSegments.concat(obj.relativeUriPathSegments)))
    if (!_.isEmpty(obj.resources)) obj.resources.forEach(validateResource.bind(undefined, relativeUriPathSegments.concat(obj.relativeUriPathSegments)))
}

function validateMethod (relativeUriPathSegments, obj) {
    var id = relativeUriPathSegments.concat(obj.method)
    var successResponseSchema = Joi.object().keys({
        body: Joi.object().keys({
            'application/json': Joi.object().keys({
                example: Joi.string(),
                schema: Joi.string().required(),
            }).required(),
        }),
    }).required()
    var methodSchema = Joi.object().keys({
        body: Joi.object().keys({
            'application/json': Joi.object().keys({
                example: Joi.string(),
                schema: Joi.string().required(),
            }).required(),
        }),
        displayName: Joi.string().required(),
        method: Joi.string().required(),
        responses: Joi.object().pattern(helper.SUCCESS_CODE_RE, successResponseSchema).required(),
    })
    var validation = Joi.validate(obj, methodSchema, { allowUnknown: true })
    if (validation.error) throw getPathSegmentsError(id, validation.error.message, INVALID_RAML)
    var response = helper.getSuccessResponseFromMethod(obj)
    if (_.has(response, 'example')) {
        validation = ajv.compile(JSON.parse(response.schema))
        validation(JSON.parse(response.example))
        if (!_.isEmpty(validation.errors)) throw getPathSegmentsError(id, JSON.stringify(validation.errors, undefined, 2), INVALID_RESPONSE_EXAMPLE)
    }
    var body = _.get(obj, 'body.application/json')
    if (_.has(body, 'example')) {
        validation = ajv.compile(JSON.parse(body.schema))
        validation(JSON.parse(body.example))
        if (!_.isEmpty(validation.errors)) throw getPathSegmentsError(id, JSON.stringify(validation.errors, undefined, 2), INVALID_REQUEST_EXAMPLE)
    }
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
