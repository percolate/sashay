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
var INVALID_EXAMPLE = 'Example does not validate against schema'
var FILTER_TEMPLATE = '\\s*#%s\\s*'

BPromise.promisifyAll(glob)
BPromise.promisifyAll(refs)

module.exports = function (options) {
    var schemaMap
    return BPromise.resolve()
        .then(getFiles.bind(undefined, options))
        .then(dereference)
        .then(writeTemp)
        .then(function (_schemaMap) {
            schemaMap = _schemaMap
        })
        .then(function () {
            return raml.loadFile(options.source)
        })
        .then(validateRamlOutput)
        .then(filterRamlOutput.bind(undefined, options.filter))
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
        return _.chain(files)
            .zip(schemas)
            .object()
            .value()
    })
}

function filterRamlOutput (filter, obj) {
    if (_.isEmpty(filter)) return obj
    var filterRegex = new RegExp(util.format(FILTER_TEMPLATE, filter), 'g')
    obj.resources = _.chain(obj.resources)
        .map(function (resource) {
            var description = _.get(resource, 'description')
            var isMatch = !_.isEmpty(description) && description.match(filterRegex)
            if (!isMatch) return undefined
            resource.description = description.replace(filterRegex, '')
            return resource
        })
        .compact()
        .value()
    return obj
}

function getFiles (options) {
    return glob.globAsync(constants.dereferenceGlobPattern, {
        root: path.dirname(options.source),
    })
}

function getPathSegmentsError (pathSegments, message, type) {
    type = type || 'Error'
    var separator = '.'
    return new Error(util.format('%s at "%s": %s', type, separator + pathSegments.join(separator), message))
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
    if (!_.has(response, 'example')) return
    validation = ajv.compile(JSON.parse(response.schema))
    validation(JSON.parse(response.example))
    if (!_.isEmpty(validation.errors)) throw getPathSegmentsError(id, JSON.stringify(validation.errors, undefined, 2), INVALID_EXAMPLE)
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
        .object()
        .forEach(function (obj) {
            fs.writeFileSync(obj.tempPath, JSON.stringify(obj.schema, undefined, 2))
        })
        .value()
}
