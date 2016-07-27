var _ = require('lodash')
var ajv = require('ajv')()
var helper = require('./helper')

var TYPES = require('./constants').types
var FORMATS = ['date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uri', 'legacy-date-time']

var ENUM_VALIDATORS = {
    [TYPES.boolean.id]: _.isBoolean,
    [TYPES.integer.id]: _.isInteger,
    [TYPES.null.id]: _.isNull,
    [TYPES.number.id]: _.isNumber,
    [TYPES.string.id]: _.isString,
}

module.exports = validate

function validate (schema, filename) {
    if (_.has(schema, 'not')) {
        throwUnsupported('`not`', schema, filename)
    }
    if (_.has(schema, 'allOf')) {
        return validateAllOf(schema, filename)
    }
    if (_.has(schema, 'anyOf')) {
        throwUnsupported('`anyOf`', schema, filename)
    }
    if (_.has(schema, 'oneOf')) {
        return validateOneOf(schema, filename)
    }
    return validateByTypes(schema, filename)
}

function validateAllOf (schema, filename) {
    if (_.isEmpty(schema.allOf)) {
        throwError(`allOf must contain at least one item`, schema, filename)
    }
    validate(helper.mergeAllOf(schema), filename)
}

function validateOneOf (schema, filename) {
    var oneOfs = helper.mergeOneOf(schema)

    if (_.isEmpty(oneOfs)) {
        throwError(`oneOf must contain at least one item`, schema, filename)
    }

    _.each(oneOfs, function (item) {
        if (_.isArray(item.type)) {
            throwError(`${item.type} (type as an array) is not supported directly inside oneOf. Leverage oneOf to break down types array instead.`, schema, filename)
        }
        if (_.has(item, 'oneOf') || _.has(item, 'allOf') || _.has(item, 'anyOf')) {
            throwError('nesting `oneOf`, `allOf`, or `anyOf` is not supported directly inside oneOf', schema, filename)
        }
        if (!_.has(item, 'type')) {
            throwError(`type is required directly inside oneOf`, schema, filename)
        }
        if (isTypeOf(item, TYPES.object.id)) {
            if (!item.title) {
                throwError('A title is required for all objects inside oneOf', schema, filename)
            }
            if (!item.example) {
                throwError('An example is required for each object inside oneOf', schema, filename)
            }
        }
        validate(item, filename)
    })
}

function validateByTypes (schema, filename) {
    if (!_.has(schema, 'type')) {
        throwError('missing type property', schema, filename)
    }
    var unsupportedTypes = _.difference(getTypes(schema), _.map(TYPES, 'id'))
    if (unsupportedTypes.length) {
        throwError(`invalid type found (${unsupportedTypes.join(', ')})`, schema, filename)
    }

    if (_.has(schema, 'format')) {
        validateFormat(schema, filename)
    }
    if (_.has(schema, 'enum')) {
        validateEnum(schema, filename)
    }

    if (isTypeOf(schema, TYPES.object.id)) {
        validateObject(schema, filename)
    }
    if (isTypeOf(schema, TYPES.array.id)) {
        validateArray(schema, filename)
    }

    if (_.has(schema, 'example')) {
        var validation = ajv.compile(schema)
        validation(JSON.parse(JSON.stringify(schema.example)))
        if (!_.isEmpty(validation.errors)) {
            throwError('invalid example', schema, filename, `Validation error:\n${JSON.stringify(validation.errors, null, 2)}`)
        }
    }
}

function validateObject (schema, filename) {
    _.each(schema.patternProperties, validateProperty.bind(undefined, filename))
    _.each(schema.properties, validateProperty.bind(undefined, filename))
}

function validateProperty (filename, schema, key) {
    if (key === 'id' || key === 'uid') {
        if (!(schema.title || '').match(/ID/)) {
            throwError('`id` or `uid` property must have a title with `ID` (ex. "User ID")', schema, filename)
        }
    }
    return validate(schema, filename)
}

function validateArray (schema, filename) {
    var items = schema.items
    if (_.isArray(items)) {
        throwUnsupported('an array of items', schema, filename)
    }
    if (_.isEmpty(items)) {
        throwError('items must be defined', schema, filename)
    }
    return validate(items, filename)
}

function validateEnum (schema, filename) {
    if (_.isEmpty(schema.enum)) {
        throwError('`enum` contain at least one item', schema, filename)
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
        throwError(`${schema.enum} does not match defined types (${types.join(', ')})`, schema, filename)
    }
}

function validateFormat (schema, filename) {
    if (!isTypeOf(schema, TYPES.string.id)) {
        throwError('invalid type (requires "string") for given `format`', schema, filename)
    }
    if (!_.includes(FORMATS, schema.format)) {
        throwError(`invalid format "${schema.format}" (${FORMATS.join(', ')})`, schema, filename)
    }
}

function throwError (message, schema, filename) {
    throw new Error(`${message} at ${filename} with schema:\n${JSON.stringify(schema)}`)
}

function throwUnsupported (message, schema, filename) {
    throwError(`${message} is not supported at this time`, schema, filename)
}

function getTypes (schema) {
    return _.isArray(schema.type) ? schema.type : [schema.type]
}

function isTypeOf (schema, type) {
    return _.includes(getTypes(schema), type)
}
