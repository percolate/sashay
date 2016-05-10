var _ = require('lodash')
var ajv = require('ajv')()
var BPromise = require('bluebird')
var constants = require('./constants')
var fs = require('fs-extra')
var glob = require('glob')
var helper = require('./helper')
var Joi = require('joi')
var path = require('path')
var raml = require('raml-1-parser')
var refs = require('json-schema-ref-parser')
var util = require('util')

var FILTER_TEMPLATE = '\\s*#%s\\s*'
var INVALID_RAML = 'Invalid RAML'
var INVALID_RESPONSE_EXAMPLE = 'Example response does not validate against schema'
var INVALID_REQUEST_EXAMPLE = 'Example request does not validate against schema'
var PRIVATE_END = '# end-private'
var PRIVATE_START = '# start-private'
var PRIVATE_RE_TEMPLATE = /# start-private[\s\S]*?# end-private(\r\n)*/m
var PUBLIC_FILTER = 'public'
var RAML_YAML_PATTERN = '/**/*.+(raml|yaml)'

BPromise.promisifyAll(fs)
BPromise.promisifyAll(glob)
BPromise.promisifyAll(refs)

module.exports = function (options) {
    var schemaMap
    return BPromise.resolve()
        .then(hidePrivateSections.bind(undefined, options, RAML_YAML_PATTERN))
        .then(getFiles.bind(undefined, options, constants.dereferenceGlobPattern))
        .then(dereference)
        .then(writeTemp)
        .then(function (_schemaMap) {
            schemaMap = _schemaMap
        })
        .then(function () {
            return raml.loadApiSync(options.temp + '/' + path.basename(options.source)).expand()
        })
        .then(validateRamlOutput)
        .finally(function () {
            cleanupTemp(schemaMap)
        })
}
module.exports.getFiles = getFiles
module.exports.dereference = dereference
module.exports.writeTemp = writeTemp

function cleanupTemp (schemaMap) {
    _.forEach(schemaMap, function (obj) {
        fs.unlinkSync(obj.tempPath)
    })
}

function dereference (files) {
    return BPromise.all(files.map(function (file) {
        return refs.dereferenceAsync(file)
    }))
    .then(function (schemas) {
        return _.zipObject(files, schemas)
    })
}

function getFiles (options, pattern) {
    return glob.globAsync(pattern, {
        root: path.dirname(options.temp),
    })
}

function getPathSegmentsError (pathSegments, message, type) {
    type = type || 'Error'
    var separator = '.'
    return new Error(util.format('%s at "%s": %s', type, separator + pathSegments.join(separator), message))
}

function hidePrivateSections (options, pattern) {
    return BPromise.resolve()
        .then(getFiles.bind(undefined, options, pattern))
        .then(function (files) {
            return _.zipObject(files, files.map(function (file) {
                return fs.readFileSync(file, 'utf-8')
            }))
        })
        .then(function (schemas) {
            _.forEach(schemas, function (schema, file) {
                fs.writeFileSync(file, splitContent(schema, options.publicOnly))
            })
            return _.keys(schemas)
        })
}

function splitContent (content, filter) {
    var matches = content.match(PRIVATE_RE_TEMPLATE)
    var trimmedContent = ''
    var currIndex = 0
    while (!_.isNull(matches) && currIndex < content.length) {
        var start = currIndex + matches.index
        trimmedContent = trimmedContent + content.substring(currIndex, start)
        if (!filter) {
            trimmedContent = trimmedContent + matches[0].replace(PRIVATE_START, '').replace(PRIVATE_END, '')
        }
        currIndex = currIndex + matches.index + matches[0].length
        matches = content.substring(currIndex).match(PRIVATE_RE_TEMPLATE)
        var newLine = content.substring(currIndex).match(/(\r\n)/i)
        var space = content.substring(currIndex).match(/\s/i)
        if (!_.isNull(newLine) && !_.isNull(space) && newLine. index > 0 && space.index > 0) {
            trimmedContent = trimmedContent + '\r\n'
        }
    }
    return trimmedContent + content.substring(currIndex)
}

function validateRamlOutput (obj) {
    var jsonObj = obj.toJSON({
        serializeMetadata: false,
    })
    var validation = Joi.validate(jsonObj, Joi.object().keys({
        baseUri: Joi.string().required(),
        resources: Joi.array().items(Joi.object()).required(),
        title: Joi.string().required(),
        version: Joi.string().required(),
    }), { allowUnknown: true })
    if (validation.error) throw getPathSegmentsError([], validation.error.message, INVALID_RAML)
    jsonObj.resources.forEach(validateRootResource)
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
                schema: Joi.alternatives(Joi.array().min(1).items(Joi.string().required()), Joi.string().required()),
            }).required(),
        }),
    }).required()
    var methodSchema = Joi.object().keys({
        body: Joi.object().keys({
            'application/json': Joi.object().keys({
                example: Joi.string(),
                schema: Joi.alternatives(Joi.array().min(1).items(Joi.string().required()), Joi.string().required()),
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
