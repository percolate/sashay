var _ = require('lodash')
var util = require('util')

var MISSING_TYPE = 'Missing type property'
var OF_ARRAY = ['oneOf', 'allOf', 'anyOf']

module.exports = validateType

function validateType (jsonSchema, filename) {
    if (!jsonSchema) {
        return
    }

    _.forEach(['patternProperties', 'properties'], function (key) {
        iterate(jsonSchema, key, filename)
    })

    if (_.has(jsonSchema, 'items')) {
        if (_.isArray(jsonSchema.items)) {
            iterate(jsonSchema, 'items', filename)
        } else {
            validateType(jsonSchema.items, filename)
        }
    }
    var specialKeys = _.intersection(Object.keys(jsonSchema), OF_ARRAY)
    if (_.isEmpty(specialKeys)) {
        if (!_.has(jsonSchema, 'type')) {
            throw new Error(util.format('%s at "%s": %s', MISSING_TYPE, filename, JSON.stringify(jsonSchema)))
        }
    }
    if (!_.isEmpty(specialKeys) && !_.has(jsonSchema, 'type')) {
        _.forEach(specialKeys, function (key) {
            iterate(jsonSchema, key, filename)
        })
    }
}

function iterate (jsonSchema, key, filename) {
    _.forEach(_.get(jsonSchema, key), function (schema) {
        validateType(schema, filename)
    })
}
