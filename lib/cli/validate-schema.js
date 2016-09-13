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

function SchemaValidationError (message, description, path) {
    Error.call(this)
    this.name = 'SchemaValidationError'
    this.message = message
    this.description = description
    this.path = path
}
util.inherits(SchemaValidationError, Error)

module.exports = validate

function validate (schema, path) {
    if (!path) path = []

    if (!_.isObject(schema)) throwError('schema must be an object', schema, path)

    if (_.has(schema, 'not')) {
        throwUnsupported('`not`', schema, path)
    }
    if (_.has(schema, 'allOf')) {
        return validateAllOf(schema, path)
    }
    if (_.has(schema, 'anyOf')) {
        throwUnsupported('`anyOf`', schema, path)
    }
    if (_.has(schema, 'oneOf')) {
        return validateOneOf(schema, path)
    }
    return validateByTypes(schema, path)
}

function validateAllOf (schema, path) {
    if (_.isEmpty(schema.allOf)) {
        throwError(`allOf must contain at least one item`, schema, path)
    }
    validate(helper.mergeAllOf(schema), path)
}

function validateOneOf (schema, path) {
    var oneOfs = helper.mergeOneOf(schema)

    if (_.isEmpty(oneOfs)) {
        throwError(`oneOf must contain at least one item`, schema, path)
    }

    var groupByType = _.groupBy(oneOfs, 'type')
    var isPolymorphic = _.size(groupByType) === 1 && _.has(groupByType, TYPES.object.id)

    _.each(oneOfs, function (item, index) {
        var currPath = path.concat('oneOf', index)
        if (_.isArray(item.type)) {
            throwError(`${item.type} (type as an array) is not supported directly inside oneOf. Leverage oneOf to break down types array instead.`, item, currPath)
        }
        if (_.has(item, 'oneOf') || _.has(item, 'allOf') || _.has(item, 'anyOf')) {
            throwError('nesting `oneOf`, `allOf`, or `anyOf` is not supported directly inside oneOf', item, currPath)
        }
        if (!_.has(item, 'type')) {
            throwError(`type is required directly inside oneOf`, item, currPath)
        }
        if (isPolymorphic) {
            if (!item.title) {
                throwError('A title is required for all objects inside oneOf', item, currPath)
            }
            if (!item.example) {
                throwError('An example is required for each object inside oneOf', item, currPath)
            }
        }
        validate(item, currPath)
    })
}

function validateByTypes (schema, path) {
    if (!_.has(schema, 'type')) {
        throwError('missing type property', schema, path)
    }
    var unsupportedTypes = _.difference(getTypes(schema), _.map(TYPES, 'id'))
    if (unsupportedTypes.length) {
        throwError(`invalid type found`, schema, path)
    }

    if (_.has(schema, 'format')) {
        validateFormat(schema, path)
    }
    if (_.has(schema, 'enum')) {
        validateEnum(schema, path)
    }

    if (isTypeOf(schema, TYPES.object.id)) {
        validateObject(schema, path)
    }
    if (isTypeOf(schema, TYPES.array.id)) {
        validateArray(schema, path)
    }

    if (_.has(schema, 'example')) {
        validateExample(schema, JSON.stringify(schema.example), function (errors) {
            if (errors) throwError('invalid example', errors, path)
        })
    }
}

function validateObject (schema, path) {
    _.each(schema.patternProperties, validateProperty.bind(undefined, path.concat('patternProperties')))
    _.each(schema.properties, validateProperty.bind(undefined, path.concat('properties')))
}

function validateProperty (path, schema, key) {
    var currPath = path.concat(key)
    if (key === 'id' || key === 'uid') {
        if (!(schema.title || '').match(/ID/)) {
            throwError('`id` or `uid` property must have a title with `ID` (ex. "User ID")', schema, currPath)
        }
    }
    return validate(schema, currPath)
}

function validateArray (schema, path) {
    var items = schema.items
    if (_.isArray(items)) {
        throwUnsupported('an array of items', schema, path)
    }
    if (_.isEmpty(items)) {
        throwError('items must be defined', schema, path)
    }
    return validate(items, path.concat('items'))
}

function validateEnum (schema, path) {
    if (_.isEmpty(schema.enum)) {
        throwError('`enum` contain at least one item', schema, path)
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
        throwError(`${schema.enum} does not match defined types (${types.join(', ')})`, schema, path)
    }
}

function validateFormat (schema, path) {
    if (!isTypeOf(schema, TYPES.string.id)) {
        throwError('invalid type (requires "string") for given `format`', schema, path)
    }
    if (!_.includes(FORMATS, schema.format)) {
        throwError(`invalid format "${schema.format}" (${FORMATS.join(', ')})`, schema, path)
    }
}

function throwError (message, schema, path) {
    throw new SchemaValidationError(message, JSON.stringify(schema, null, 2), path)
}

function throwUnsupported (message, schema, path) {
    throwError(`${message} is not supported at this time`, schema, path)
}

function getTypes (schema) {
    return _.isArray(schema.type) ? schema.type : [schema.type]
}

function isTypeOf (schema, type) {
    return _.includes(getTypes(schema), type)
}
