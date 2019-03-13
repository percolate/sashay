var _ = require('lodash')
var helper = require('./helper')
var Joi = require('joi')
var securedBy = require('./constants').securedBy
var validateExample = require('./validate-example')
var validateSchema = require('./validate-schema')

var INVALID_RAML = 'Invalid RAML'

module.exports = function validateRamlOutput(raml) {
    var validation = Joi.validate(
        raml,
        Joi.object().keys({
            baseUri: Joi.string().required(),
            resources: Joi.array()
                .items(Joi.object())
                .required(),
            title: Joi.string().required(),
            version: Joi.string().required(),
        }),
        { allowUnknown: true }
    )
    if (validation.error)
        throwError(['root'], validation.error.message, INVALID_RAML)
    raml.resources.forEach(validateRootResource)
    return raml
}

function validateRootResource(raml) {
    var validation = Joi.validate(
        raml,
        Joi.object().keys({
            displayName: Joi.string().required(),
        }),
        { allowUnknown: true }
    )
    if (validation.error)
        throwError(
            raml.relativeUriPathSegments,
            validation.error.message,
            INVALID_RAML
        )
    if (!_.isEmpty(raml.methods))
        raml.methods.forEach(
            validateMethod.bind(undefined, raml.relativeUriPathSegments)
        )
    if (!_.isEmpty(raml.resources))
        raml.resources.forEach(
            validateResource.bind(undefined, raml.relativeUriPathSegments)
        )
}

function validateResource(relativeUriPathSegments, raml) {
    if (!_.isEmpty(raml.methods))
        raml.methods.forEach(
            validateMethod.bind(
                undefined,
                relativeUriPathSegments.concat(raml.relativeUriPathSegments)
            )
        )
    if (!_.isEmpty(raml.resources))
        raml.resources.forEach(
            validateResource.bind(
                undefined,
                relativeUriPathSegments.concat(raml.relativeUriPathSegments)
            )
        )
}

function validateMethod(relativeUriPathSegments, raml) {
    var path = relativeUriPathSegments.concat(raml.method)
    var successResponseJsonSchema = Joi.object().keys({
        example: Joi.string(),
        schema: Joi.string().required(),
    })
    var successResponseSchema = Joi.object()
        .keys({
            body: Joi.object()
                .unknown(false)
                .keys({
                    'application/json': Joi.alternatives()
                        .try(null, successResponseJsonSchema)
                        .required(),
                }),
        })
        .required()
    var methodSchema = Joi.object().keys({
        body: Joi.object()
            .min(1)
            .unknown(false)
            .keys({
                'application/json': Joi.object().keys({
                    example: Joi.string(),
                    schema: Joi.string().required(),
                }),
                'application/x-www-form-urlencoded': Joi.object().keys({
                    formParameters: Joi.object().required(),
                    example: Joi.string(),
                }),
            }),
        displayName: Joi.string().required(),
        method: Joi.string().required(),
        responses: Joi.object()
            .pattern(helper.SUCCESS_CODE_RE, successResponseSchema)
            .required(),
        securedBy: Joi.array().items(
            Joi.any(
                Joi.any().valid(_.keys(securedBy)),
                Joi.object()
                    .min(1)
                    .unknown(false)
                    .keys(
                        _.chain(securedBy)
                            .map(function(security) {
                                return [security.id, Joi.object()]
                            })
                            .fromPairs()
                            .value()
                    )
            )
        ),
    })
    var validation = Joi.validate(raml, methodSchema, { allowUnknown: true })
    if (validation.error)
        throwError(path, validation.error.message, INVALID_RAML)

    _.each(raml.responses, function(response, code) {
        validatePayload(path.concat('responses', code), response)
    })
    // request body
    validatePayload(path, raml)
}

function validatePayload(path, raml) {
    if (!_.has(raml, 'body')) return

    var payload = _.get(raml, ['body', 'application/json'])
    var schemaPath = path.concat('body', 'application/json', 'schema')
    var examplePath = path.concat('body', 'application/json', 'example')

    if (_.has(payload, 'schema')) {
        try {
            validateSchema(JSON.parse(payload.schema), schemaPath)
        } catch (e) {
            if (e.name === 'SchemaValidationError') {
                throwError(
                    e.path,
                    e.description,
                    `Invalid schema: ${e.message}`
                )
            } else {
                throw e
            }
        }
    }

    if (_.has(payload, 'example')) {
        validateExample(payload.schema, payload.example, function(errors) {
            if (errors) {
                throwError(
                    examplePath,
                    JSON.stringify(errors, undefined, 2),
                    'Invalid example'
                )
            }
        })
    }
}

function throwError(pathSegments, message, type) {
    throw new Error(`${type} at "${pathSegments.join('.')}": ${message}`)
}
