var _ = require('lodash')
var ajv = require('ajv')()
var util = require('util')
var TYPES = require('./constants').types

var DIFFERENT_TYPES = 'Different types in allOf'
var EMPTY_ITEMS = `\`items\` cannot be empty for type \`array\``
var ENUM_NOT_STRING = 'Enum value is not string'
var FORMATS = ['date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri', 'legacy-date-time']
var ID_TITLE = 'Id property must have a title with `ID`'
var INVALID_EXAMPLE = 'Example is not valid according to the schema'
var MISSING_EXAMPLE = 'Missing example property'
var MISSING_TYPE = 'Missing type property'
var NESTED_ONEOF = 'nested \`oneOf\` are not supported'
var OF_ARRAY = ['oneOf', 'allOf', 'anyOf']
var TYPES_IN_ONEOF = '`type: [...]` is not supported directly inside `oneOf`'
var UNSUPPORTED_FORMAT = 'Unsupported format'

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
        validateFormat(jsonSchema, filename)
    }
    if (!_.isEmpty(specialKeys) && !_.has(jsonSchema, 'type')) {
        _.forEach(specialKeys, function (key) {
            iterate(jsonSchema, key, filename)
        })
        validateAllOf(jsonSchema, filename)
    }
    validateOneOf(jsonSchema, filename)
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
            var types = null
            if (jsonSchema.type) {
                types = _.isArray(jsonSchema.type) ? jsonSchema.type : [jsonSchema.type]
            } else if (item.type) {
                    types = [item.type]
            }
            if (types && _.includes(types, 'object')) {
                if (!item.example) {
                    throwError(MISSING_EXAMPLE, filename, item)
                } else {
                    var validation = ajv.compile(item)
                    validation(JSON.parse(JSON.stringify(item.example)))
                    if (!_.isEmpty(validation.errors)) throwError(INVALID_EXAMPLE, filename, validation.errors)
                }
            }
            if (item.oneOf) {
                throwError(NESTED_ONEOF, filename, item)
            }
            if (item.type && !_.has(TYPES, item.type)) {
                throwError(`${item.type} is not a supported type:`, filename, item)
            }
        })
    }
}

function validateItems (jsonSchema, filename) {
    if (_.has(jsonSchema, 'items') || _.has(jsonSchema, 'type') && jsonSchema.type === 'array') {
        if (_.isEmpty(jsonSchema.items)) {
            throwError(EMPTY_ITEMS, filename, jsonSchema)
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
            throwError(DIFFERENT_TYPES, filename, JSON.stringify(jsonSchema))
        }
    }
}

function validateFormat (jsonSchema, filename) {
    if (jsonSchema.format) {
        if (!_.includes(FORMATS, jsonSchema.format)) {
            throwError(UNSUPPORTED_FORMAT + ' ' + jsonSchema.format, filename, jsonSchema)
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
