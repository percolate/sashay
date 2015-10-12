var _ = require('lodash')
var ajv = require('ajv')()
var BPromise = require('bluebird')
var Joi = require('joi')
var parser = require('swagger-parser')
var util = require('util')

var VALIDATION_ERROR = 'Example #%s.%s does not match schema'
var VERBS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch']
var X_ATTR_RE = /^x-/
var operationCustomAttrsSchema = Joi.object().keys({
    'x-deprecated-at': Joi.string(),
    'x-public': Joi.boolean(),
})

module.exports = function (options) {
    return parse(options.source).then(validate)
}

function parse (source) {
    return new BPromise(function (resolve, reject) {
        parser.dereference(source, function (err, schema) {
            if (err) return reject(err)
            parser.validate(schema, function (err2) {
                if (err2) return reject(err2)
                return resolve(schema)
            })
        })
    })
}

function validate (schema) {
    _.forEach(schema.paths, function (pathItem, path) {
        _.forEach(pathItem, function (operation, verb) {
            var operationId = [
                path,
                verb,
            ].join('.')
            // validate swagger-optional fields
            if (_.includes(VERBS, verb) && _.isEmpty(operation.summary)) throw new Error('Operation Object must have `summary`')
            // validate request/response examples against schema
            var body = _.findWhere(operation.parameters, { in: 'body' })
            if (_.has(body, 'schema.example')) {
                assertSchemaValid(body.schema, [operationId, 'parameters[n].body.schema.example'].join('.'))
            }
            if (_.has(operation, 'responses.200.schema.example')) {
                assertSchemaValid(operation.responses['200'].schema, [operationId, 'responses.200.schema.example'].join('.'))
            }
            var customAttrs = _.pick(operation, function (val, key) {
                return key.match(X_ATTR_RE)
            })
            Joi.assert(customAttrs, operationCustomAttrsSchema)
        })
    })
    return schema
}

function assertSchemaValid (schema, description) {
    var validation = ajv.compile(schema)
    validation(schema.example)
    if (_.isEmpty(validation.errors)) return
    throw new Error(util.format(VALIDATION_ERROR, description, JSON.stringify(validation.errors, undefined, 2)))
}
