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
var FILTER_TEMPLATE = '\\s*#%s\\s*'
var PRIVATE_RE_TEMPLATE = /<private>[\s\S]*?<\/private>/m
var TRIM_NEWLINE_RE = /^\s+|\s+$/m

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
        .then(hidePrivateSections.bind(undefined, options))
        .then(composeRaml)
        .then(validateRamlOutput)
        .then(filterRamlOutput.bind(undefined, options.filter))
        .finally(function () {
            cleanupTemp(schemaMap)
        })
}
module.exports.getFiles = getFiles
module.exports.dereference = dereference
module.exports.writeTemp = writeTemp

function composeRaml (ramls) {
    for (var key in ramls)
    console.log('raml: ' + ramls[key]);
}

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

function hidePrivateSections (options) {
    var ramls = {}
    console.log('eeeee ' + path.normalize(options.source + '/..') + '/**/resources/*.raml');
    glob.globAsync('c:/incoming/*.txt', function (err, ramlPaths) {
        console.log('dddddd:' + path);

        if (err) throw new Error(util.format('Error matching RAML files in %s', options.source))
        _.forEach(ramlPaths, function(path) {
            console.log('aaaaaa:' + path);
            fs.readFile(path, 'utf-8', function(err, data) {
                if (err) throw new Error(util.format('Error loading %s', path))
                ramls[path] = splitContent(data)
                console.log(ramls[path]);
            })
        })
    })
    console.log('aaaaaa');
    for (var key in ramls)
      console.log('raml: ' + ramls[key]);
    return ramls
}

function loadRaml (options, ramls) {
    var ramlString = ''
    console.log('000000');
    fs.readFile(options.source, 'utf-8', function(err, data) {
        ramlString = data
        console.log(ramlString);

    })
    console.log('11111');
    return raml.load(ramlString)
}

function splitContent (content) {
    var matches = content.match(PRIVATE_RE_TEMPLATE)
    var trimmedContent =''
    var currIndex = 0

    while (!_.isNull(matches) && currIndex < content.length)
    {
        trimmedContent = trimmedContent + content.substring(currIndex, currIndex + matches.index).replace(TRIM_NEWLINE_RE, '')
        currIndex = currIndex + matches.index + matches[0].length
        matches = content.substring(currIndex).match(PRIVATE_RE_TEMPLATE)
    }

    return trimmedContent + content.substring(currIndex).replace(TRIM_NEWLINE_RE, '')
}

function validateRamlOutput (obj) {
    console.log('cccccc');
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
