var _ = require('lodash')
var util = require('util')
var TYPES = require('./constants').types

var MISSING_TYPE = 'Missing type property'
var OF_ARRAY = ['oneOf', 'allOf', 'anyOf']
var ENUM_NOT_STRING = 'Enum value is not string'
var DIFFERENT_TYPES = 'Different types in allOf'
var UNSUPPORTED_SCHEMA_TYPE = 'Unsupported schema type'
var TYPES_IN_ONEOF = '`type: [...]` is not supported directly inside `oneOf`'
var NESTED_ONEOF = 'nested \`oneOf\` are not supported'
var ID_TITLE = 'Id property must have a title with `ID`'

module.exports = validateSchema

function validateSchema (jsonSchema, filename) {
    if (!jsonSchema) {
        return
    }

    _.forEach(['patternProperties', 'properties'], function (key) {
        iterate(jsonSchema, key, filename)
    })

    _.forEach(jsonSchema.properties, function (property, name) {
        if (name === 'id' || name === 'uid') {
            if (!property.title || (property.title && !property.title.match(/ID/))) {
                throwError(ID_TITLE, filename, property)
            }
        }
    })

    validateItems(jsonSchema, filename)

    var specialKeys = _.intersection(Object.keys(jsonSchema), OF_ARRAY)
    if (_.isEmpty(specialKeys)) {
        if (_.has(jsonSchema, 'enum')) {
            _.forEach(jsonSchema.enum, function (value) {
                if (!_.isString(value) && value !== null) {
                    throwError(ENUM_NOT_STRING, filename, jsonSchema)
                }
            })
        }
        validateType(jsonSchema, filename)
    }
    if (!_.isEmpty(specialKeys) && !_.has(jsonSchema, 'type')) {
        _.forEach(specialKeys, function (key) {
            iterate(jsonSchema, key, filename)
        })
        validateAllOf(jsonSchema, filename)
    }
    validateOneOf(jsonSchema, filename)

    if (!_.has(jsonSchema, 'anyOf') && !_.has(jsonSchema, 'oneOf') && !_.has(jsonSchema, 'allOf') && !_.has(jsonSchema, 'type')) {
        throwError(UNSUPPORTED_SCHEMA_TYPE, filename, jsonSchema)
    }
}

function iterate (jsonSchema, key, filename) {
    _.forEach(_.get(jsonSchema, key), function (schema) {
        validateSchema(schema, filename)
    })
}

function validateOneOf (jsonSchema, filename) {
    if (jsonSchema.oneOf) {
        _.forEach(jsonSchema.oneOf, function (item) {
            if (_.isArray(item.type)) {
                throwError(TYPES_IN_ONEOF, filename, item)
            }
            if (item.oneOf) {
                throwError(NESTED_ONEOF, filename, item)
            }
            if (jsonSchema.oneOf.type && !_.has(TYPES, item.type)) {
                throwError(`${item.type} is not a supported type:`, filename, item)
            }
        })
    }
}

function validateItems (jsonSchema, filename) {
    if (_.has(jsonSchema, 'items') || _.has(jsonSchema, 'type') && jsonSchema.type === 'array') {
        if (_.isEmpty(jsonSchema.items)) {
            throw new Error(`\`items\` cannot be empty for type \`array\`: ${JSON.stringify(jsonSchema)}`)
        }
        if (_.isArray(jsonSchema.items)) {
            iterate(jsonSchema, 'items', filename)
        } else {
            validateSchema(jsonSchema.items, filename)
        }
    }
}

function throwError (message, filename, item) {
    throw new Error(util.format('%s at %s: %s', message, filename, JSON.stringify(item)))
}

function validateAllOf (jsonSchema, filename) {
    if (jsonSchema.allOf) {
        var diffTypes = _.groupBy(jsonSchema.allOf, function (schema) {
            return schema.type
        })
        if (_.keys(diffTypes).length > 1) {
            throw new Error(util.format('%s at "%s": %s', DIFFERENT_TYPES, filename, JSON.stringify(jsonSchema)))
        }
    }
}

function validateType (jsonSchema, filename) {
    if (!_.has(jsonSchema, 'type')) {
        throwError(MISSING_TYPE, filename, jsonSchema)
    } else {
        var types = jsonSchema.type
        if (!_.isArray(jsonSchema.type)) {
            types = [jsonSchema.type]
        }
        _.forEach(types, function (type) {
            if (!_.has(TYPES, type)) {
                throwError(`${type} is not a supported JSON-SCHEMA type`, filename, jsonSchema)
            }
        })
    }
}
