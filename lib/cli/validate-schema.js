var _ = require('lodash')
var helper = require('./helper')
var util = require('util')
var validateExample = require('./validate-example')

var TYPES = require('./constants').types
var FORMATS = ['date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri', 'legacy-date-time']

var ENUM_VALIDATORS = {
    [TYPES.boolean.id]: _.isBoolean,
    [TYPES.integer.id]: _.isInteger,
    [TYPES.null.id]: _.isNull,
    [TYPES.number.id]: _.isNumber,
    [TYPES.string.id]: _.isString,
}

function SchemaValidationError (message, description) {
    Error.call(this)
    this.name = 'SchemaValidationError'
    this.message = message
    this.description = description
}
util.inherits(SchemaValidationError, Error)

module.exports = validate

function validate (schema) {
    if (!_.isObject(schema)) throwError('schema must be an object', schema)

    if (_.has(schema, 'not')) {
        throwUnsupported('`not`', schema)
    }
    if (_.has(schema, 'allOf')) {
        return validateAllOf(schema)
    }
    if (_.has(schema, 'anyOf')) {
        throwUnsupported('`anyOf`', schema)
    }
    if (_.has(schema, 'oneOf')) {
        return validateOneOf(schema)
    }
    return validateByTypes(schema)
}

function validateAllOf (schema) {
    if (_.isEmpty(schema.allOf)) {
        throwError(`allOf must contain at least one item`, schema)
    }
    validate(helper.mergeAllOf(schema))
}

function validateOneOf (schema) {
    var oneOfs = helper.mergeOneOf(schema)

    if (_.isEmpty(oneOfs)) {
        throwError(`oneOf must contain at least one item`, schema)
    }

    var groupByType = _.groupBy(oneOfs, 'type')
    var isPolymorphic = _.size(groupByType) === 1 && _.has(groupByType, TYPES.object.id)

    _.each(oneOfs, function (item) {
        if (_.isArray(item.type)) {
            throwError(`${item.type} (type as an array) is not supported directly inside oneOf. Leverage oneOf to break down types array instead.`, item)
        }
        if (_.has(item, 'oneOf') || _.has(item, 'allOf') || _.has(item, 'anyOf')) {
            throwError('nesting `oneOf`, `allOf`, or `anyOf` is not supported directly inside oneOf', item)
        }
        if (!_.has(item, 'type')) {
            throwError(`type is required directly inside oneOf`, item)
        }
        if (isPolymorphic) {
            if (!item.title) {
                throwError('A title is required for all objects inside oneOf', item)
            }
            if (!item.example) {
                throwError('An example is required for each object inside oneOf', item)
            }
        }
        validate(item)
    })
}

function validateByTypes (schema) {
    if (!_.has(schema, 'type')) {
        throwError('missing type property', schema)
    }
    var unsupportedTypes = _.difference(getTypes(schema), _.map(TYPES, 'id'))
    if (unsupportedTypes.length) {
        throwError(`invalid type found`, schema)
    }

    if (_.has(schema, 'format')) {
        validateFormat(schema)
    }
    if (_.has(schema, 'enum')) {
        validateEnum(schema)
    }

    if (isTypeOf(schema, TYPES.object.id)) {
        validateObject(schema)
    }
    if (isTypeOf(schema, TYPES.array.id)) {
        validateArray(schema)
    }

    if (_.has(schema, 'example')) {
        validateExample(schema, JSON.stringify(schema.example), function (errors) {
            if (errors) throwError('invalid example', errors)
        })
    }
}

function validateObject (schema) {
    _.each(schema.patternProperties, validateProperty.bind(undefined))
    _.each(schema.properties, validateProperty.bind(undefined))
}

function validateProperty (schema, key) {
    if (key === 'id' || key === 'uid') {
        if (!(schema.title || '').match(/ID/)) {
            throwError('`id` or `uid` property must have a title with `ID` (ex. "User ID")', schema)
        }
    }
    return validate(schema)
}

function validateArray (schema) {
    var items = schema.items
    if (_.isArray(items)) {
        throwUnsupported('an array of items', schema)
    }
    if (_.isEmpty(items)) {
        throwError('items must be defined', schema)
    }
    return validate(items)
}

function validateEnum (schema) {
    if (_.isEmpty(schema.enum)) {
        throwError('`enum` contain at least one item', schema)
    }

    var types = getTypes(schema)
    var validators = _.values(_.pick(ENUM_VALIDATORS, types))

    if (!validators.length) return

    var validated = _.every(schema.enum, function (enumerator) {
        return _.find(validators, function (validator) {
            return validator(enumerator)
        })
    })

    if (!validated) {
        throwError(`${schema.enum} does not match defined types (${types.join(', ')})`, schema)
    }
}

function validateFormat (schema) {
    if (!isTypeOf(schema, TYPES.string.id)) {
        throwError('invalid type (requires "string") for given `format`', schema)
    }
    if (!_.includes(FORMATS, schema.format)) {
        throwError(`invalid format "${schema.format}" (${FORMATS.join(', ')})`, schema)
    }
}

function throwError (message, schema) {
    throw new SchemaValidationError(message, JSON.stringify(schema, null, 2))
}

function throwUnsupported (message, schema) {
    throwError(`${message} is not supported at this time`, schema)
}

function getTypes (schema) {
    return _.isArray(schema.type) ? schema.type : [schema.type]
}

function isTypeOf (schema, type) {
    return _.includes(getTypes(schema), type)
}
