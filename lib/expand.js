var _ = require('lodash')
var ajv = require('ajv')()
var BPromise = require('bluebird')
var fs = require('fs-extra')
var glob = require('glob')
var helper = require('./helper')
var Joi = require('joi')
var path = require('path')
var raml = require('raml-parser')
var refs = require('json-schema-ref-parser')
var util = require('util')

var ERROR_TEMPLATE = 'Error at %s: %s'
var DEREFERENCE_PATTERN = util.format('/schemas/**/*(%s).yaml', [
    '.example',
    'item',
    'list',
    'object',
    'post',
    'put',
].join('|'))

module.exports = function (options) {
    var schemaMap
    return BPromise.resolve()
        .then(function () {
            return readDirFiles(path.dirname(options.source))
        })
        .then(dereference)
        .then(writeTemp)
        .then(function (_schemaMap) {
            schemaMap = _schemaMap
        })
        .then(function () {
            return raml.loadFile(options.source)
        })
        .then(validateRamlOutput)
        .finally(function () {
            cleanupTemp(schemaMap)
        })
}

function cleanupTemp (schemaMap) {
    _.forEach(schemaMap, function (obj) {
        fs.unlinkSync(obj.tempPath)
    })
}

function dereference (files) {
    return BPromise.all(files.map(function (file) {
        return new BPromise(function (resolve, reject) {
            refs.dereference(file, function (err, res) {
                if (err) return reject(err)
                return resolve(res)
            })
        })
    }))
    .then(function (schemas) {
        return _.chain(files)
            .zip(schemas)
            .object()
            .value()
    })
}

function readDirFiles (sourceDir) {
    return new BPromise(function (resolve, reject) {
        var options = {
            root: sourceDir,
        }
        glob(DEREFERENCE_PATTERN, options, function (err, res) {
            if (err) return reject(err)
            return resolve(res)
        })
    })
}

function validateRamlOutput (obj) {
    var validation = Joi.validate(obj, Joi.object().keys({
        baseUri: Joi.string().required(),
        title: Joi.string().required(),
        version: Joi.string().required(),
    }), { allowUnknown: true })
    if (validation.error) throw validation.error
    obj.resources.forEach(validateRootResource)
    return obj
}

function validateRootResource (obj) {
    var validation = Joi.validate(obj, Joi.object().keys({
        displayName: Joi.string().required(),
    }), { allowUnknown: true })
    if (validation.error) throw new Error(util.format(ERROR_TEMPLATE, obj.relativeUriPathSegments.join('.'), validation.error.message))
    if (!_.isEmpty(obj.methods)) obj.methods.forEach(validateMethod.bind(undefined, obj.relativeUriPathSegments))
    if (!_.isEmpty(obj.resources)) obj.resources.forEach(validateResource.bind(undefined, obj.relativeUriPathSegments))
}

function validateResource (relativeUriPathSegments, obj) {
    if (!_.isEmpty(obj.methods)) obj.methods.forEach(validateMethod.bind(undefined, relativeUriPathSegments.concat(obj.relativeUriPathSegments)))
    if (!_.isEmpty(obj.resources)) obj.resources.forEach(validateResource.bind(undefined, relativeUriPathSegments.concat(obj.relativeUriPathSegments)))
}

function validateMethod (relativeUriPathSegments, obj) {
    var id = relativeUriPathSegments.concat(obj.method).join('.')
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
    if (validation.error) throw new Error(util.format(ERROR_TEMPLATE, id, validation.error.message))
    var response = helper.getSuccessResponseFromMethod(obj)
    if (!_.has(response, 'example')) return
    validation = ajv.compile(JSON.parse(response.schema))
    validation(JSON.parse(response.example))
    if (!_.isEmpty(validation.errors)) throw new Error(util.format(ERROR_TEMPLATE, id, JSON.stringify(validation.errors, undefined, 2)))
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
