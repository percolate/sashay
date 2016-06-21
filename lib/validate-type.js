var _ = require('lodash')
var util = require('util')

var MISSING_TYPE = 'Missing type property'
var OF_ARRAY = ['oneOf', 'allOf', 'anyOf']

module.exports = validateType

function validateType (jsonSchema, filename) {
    if (!jsonSchema) {
        return
    }

    _.forEach(['patternProperties', 'properties'].concat(OF_ARRAY), function (key) {
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
    if (_.isEmpty(specialKeys) ||
        (!_.isEmpty(specialKeys) && hasMissingTypeInObjects(jsonSchema, specialKeys))) {
        if (!_.has(jsonSchema, 'type')) {
            throw new Error(util.format('%s at "%s": %s', MISSING_TYPE, filename, JSON.stringify(jsonSchema)))
        }
    }
}

function iterate (jsonSchema, key, filename) {
    _.forEach(_.get(jsonSchema, key), function (schema) {
        validateType(schema, filename)
    })
}

function hasMissingTypeInObjects (schema, specialKeys) {
    return _.chain(specialKeys)
        .map(function (key) {
            return _.chain(_.get(schema, key))
                .map(function (item) {
                    return !_.has(item, 'type')
                })
                .includes(true)
                .value()
        })
        .includes(true)
        .value()
}
