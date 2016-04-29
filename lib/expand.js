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
var MODIFIED_RAML_SUFFIX = '1'
var RAML_PATTERN = '/**/resources/*.raml'
var MODIFIED_RAML_PATTERN = '/**/resources/*' + MODIFIED_RAML_SUFFIX + '.raml'

BPromise.promisifyAll(fs)
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
        .then(getRAMLs.bind(undefined, options))
        .then(hidePrivateSections.bind(undefined, options))
        .then(composeRaml.bind(undefined, options))
        // .then(function (){
        //     return raml.loadFile(options.source)
        // })
        .then(validateRamlOutput)
        .then(filterRamlOutput.bind(undefined, options.filter))
        .finally(function () {
            cleanupTemp(schemaMap, options)
        })
}
module.exports.getFiles = getFiles
module.exports.dereference = dereference
module.exports.writeTemp = writeTemp

function composeRaml (options, ramls) {
    var newRAMLfile = options.source + MODIFIED_RAML_SUFFIX

    return BPromise.resolve(fs.readFileAsync(options.source, 'utf-8'))
        .then(function(index){
            _.forEach(ramls, function(value) {
                var relativePath = value.replace(path.dirname(options.source), '').replace(/\\/g, '/').substring(1)
                index = index.replace(relativePath, getModifiedRamlFile(relativePath))
            })
            fs.writeFileSync(newRAMLfile, index)
        })
        .then(function () {
            return raml.loadFile(newRAMLfile)
        })
}

function cleanupTemp (schemaMap, options) {
    _.forEach(schemaMap, function (obj) {
        console.log('del ' + obj.tempPath);
        fs.access(obj.tempPath, fs.F_OK, function (err) {
            if (!err) fs.unlinkSync(obj.tempPath)
        })
    })
    glob.glob(path.dirname(options.source) + MODIFIED_RAML_PATTERN, function (err, files){
        _.forEach(files, function (file){
            fs.access(file, fs.F_OK, function (err) {
                if (!err) fs.unlinkSync(file)
            })
        })
    })
    //fs.unlinkSync(options.source + MODIFIED_RAML_SUFFIX)
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

function getModifiedRamlFile (file) {
    file = file.replace(new RegExp(MODIFIED_RAML_SUFFIX, 'g'), '')
    return path.dirname(file) + '/' + path.basename(file, '.raml') + MODIFIED_RAML_SUFFIX + '.raml'
}

function getPathSegmentsError (pathSegments, message, type) {
    type = type || 'Error'
    var separator = '.'
    return new Error(util.format('%s at "%s": %s', type, separator + pathSegments.join(separator), message))
}

function getRAMLs(options) {
    return glob.globAsync(RAML_PATTERN, {
        root: path.dirname(options.source)
    })
}

function hidePrivateSections (options, files) {
    return BPromise.all(files.map(function (file) {
        return fs.readFileAsync(file, 'utf-8')
    }))
    .then(function (ramls) {
        var obj = _.zipObject(files, ramls)
        _.forEach(obj, function (data, file){
            fs.writeFileSync(getModifiedRamlFile(file), splitContent(data))
        })
        return files
    })
    .catch(function(err) {
        console.error(err);
    });
}

function splitContent (content) {
    var matches = content.match(PRIVATE_RE_TEMPLATE)
    var trimmedContent =''
    var currIndex = 0

    while (!_.isNull(matches) && currIndex < content.length)
    {
        trimmedContent = trimmedContent + content.substring(currIndex, currIndex + matches.index)
        currIndex = currIndex + matches.index + matches[0].length
        matches = content.substring(currIndex).match(PRIVATE_RE_TEMPLATE)
    }

    return trimmedContent + content.substring(currIndex)
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
