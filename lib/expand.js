var _ = require('lodash')
var ajv = require('ajv')()
var constants = require('./constants')
var BPromise = require('bluebird')
var Joi = require('joi')
var parser = require('swagger-parser')
var util = require('util')

var VALIDATION_ERROR = 'Example #%s.%s does not match schema'
var VERBS = constants.verbs.id
var operationSchema = Joi.object().keys({
    description: Joi.string(),
    parameters: Joi.array(),
    responses: Joi.object(),
    security: Joi.array(),
    summary: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    'x-deprecated-at': Joi.string().allow(null).required(),
    'x-public': Joi.boolean().required(),
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
            if (!_.includes(VERBS, verb)) return
            var operationId = [
                path,
                verb,
            ].join('.')
            var validation = Joi.validate(operation, operationSchema)
            if (validation.error) throw new Error(validation.error.message + ' at ' + operationId)
            var body = _.findWhere(operation.parameters, { in: 'body' })
            if (_.has(body, 'schema.example')) {
                assertSchemaValid(body.schema, [operationId, 'parameters[n].body.schema.example'].join('.'))
            }
            if (_.has(operation, 'responses.200.schema.example')) {
                assertSchemaValid(operation.responses['200'].schema, [operationId, 'responses.200.schema.example'].join('.'))
            }
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
