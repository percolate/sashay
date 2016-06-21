var _ = require('lodash')
var util = require('util')

var MISSING_TYPE = 'Missing type property'
var OF_ARRAY = ['oneOf', 'allOf', 'anyOf']

module.exports = validateSchema

function validateSchema (jsonSchema, filename) {
    if (!jsonSchema) {
        return
    }

    _.forEach(['patternProperties', 'properties'].concat(OF_ARRAY), function (key) {
        validate(jsonSchema, key, filename)
    })

    if (_.has(jsonSchema, 'items')) {
        if (_.isArray(jsonSchema.items)) {
            validate(jsonSchema, 'items', filename)
        } else {
            validateSchema(jsonSchema.items, filename)
        }
    }
    if (_.isEmpty(_.intersection(Object.keys(jsonSchema), OF_ARRAY)) ||
        (!_.isEmpty(_.intersection(Object.keys(jsonSchema), OF_ARRAY)) && _.has(jsonSchema, 'properties'))) {
        if (!_.has(jsonSchema, 'type')) {
            throw new Error(util.format('%s at "%s": %s', MISSING_TYPE, filename, JSON.stringify(jsonSchema)))
        }
    }
 }

function validate (jsonSchema, key, filename) {
    _.forEach(_.get(jsonSchema, key), function (schema) {
        validateSchema(schema, filename)
    })
}
