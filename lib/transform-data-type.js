var _ = require('lodash')

var TYPES = {
    array: { id: 'array' },
    boolean: { id: 'boolean' },
    integer: { id: 'integer' },
    null: { id: 'null' },
    number: { id: 'number' },
    object: { id: 'object' },
    string: { id: 'string' },
}
var DEFAULT_SUBTYPE_TITLE = 'Subtype'

function transform (schema) {
    if (_.has(schema, 'allOf')) {
        return transformAllOf(schema)
    }
    if (_.has(schema, 'oneOf')) {
        return transformOneOf(schema)
    }

    if (_.has(schema, 'type')) {
        var types = _.isArray(schema.type) ? schema.type : [schema.type]
        return _.chain(types)
            .map(function (type) {
                return [type, [transformByType(schema, type)]]
            })
            .fromPairs()
            .value()
    }
    throw new Error(`Unsupported schema type: ${JSON.stringify(schema)}`)
}

module.exports = transform

function transformAllOf (schema) {
    var merged = _.omit(schema, 'allOf')
    _.forEach(schema.allOf, function (item) {
        merged = _.mergeWith(merged, item, schemaMerge)
    })
    return transform(merged)
}

function transformByType (schema, type) {
    switch (type) {
        case TYPES.object.id:
            return transformObject(schema)
        case TYPES.array.id:
            return transformArray(schema)
        case TYPES.boolean.id:
        case TYPES.integer.id:
        case TYPES.null.id:
        case TYPES.number.id:
        case TYPES.string.id:
            return transformScalar(schema, type)
        default:
            throw new Error(`${type} is not a supported JSON-SCHEMA type`)
    }
}

function transformArray (schema) {
    if (_.isEmpty(schema.items)) {
        throw new Error(`\`items\` cannot be empty for type \`array\`: ${JSON.stringify(schema)}`)
    }
    return {
        description: schema.description,
        types: transform(schema.items),
    }
}

function transformObject (schema) {
    var properties = {}

    if (!_.isEmpty(schema.properties)) {
        properties = _.chain(schema.properties)
            .map(function (prop, key) {
                var transformedProp = {
                    required: _.has(schema, 'required') && _.includes(schema.required, key),
                    types: transform(prop),
                }
                return [key, transformedProp]
            })
            .fromPairs()
            .value()
    }

    return {
        description: schema.description,
        properties: properties,
    }
}

function transformScalar (schema, type) {
    var output = {
        description: schema.description,
    }
    switch (type) {
        case TYPES.string.id:
            _.extend(output, {
                enum: schema.enum,
                pattern: schema.pattern,
            })
            break
        case TYPES.boolean.id:
        case TYPES.integer.id:
        case TYPES.null.id:
        case TYPES.number.id:
            // noop
            break
    }

    return output
}

function transformOneOf (schema) {
    var oneOfs = schema.oneOf

    // merge all oneOfs current data type
    // ex.
    //      type: object
    //      properties:
    //          ...
    //      oneOf:
    //        - $ref: object.types.yaml#/assets
    //        - $ref: object.types.yaml#/link
    //        ...
    if (_.keys(schema).length > 1) {
        var baseSchema = _.omit(schema, 'oneOf')
        oneOfs = _.map(schema.oneOf, function (oneOf) {
            return _.mergeWith({}, baseSchema, oneOf, schemaMerge)
        })
    }

    var types = _.groupBy(oneOfs, function (item) {
        if (_.isArray(item.type)) {
            throw new Error(`\`type: [...]\` is not supported directly inside \`oneOf\`: ${JSON.stringify(item)}`)
        }
        if (item.oneOf) {
            throw new Error(`nested \`oneOf\` are not supported: ${JSON.stringify(item)}`)
        }
        if (!_.has(TYPES, item.type)) {
            throw new Error(`${item.type} is not a supported type: ${JSON.stringify(item)}`)
        }
        return item.type
    })

    return _.chain(types)
        .map(function (subTypes, type) {
            var transformedSubTypes = _.map(subTypes, function (subType, index) {
                var transformedSubType = transformByType(subType, type)
                transformedSubType.title = subType.title || `${DEFAULT_SUBTYPE_TITLE} ${index + 1}`
                return transformedSubType
            })
            return [type, transformedSubTypes]
        })
        .fromPairs()
        .value()
}

function schemaMerge (objValue, srcValue) {
    if (_.isArray(objValue) && _.isArray(srcValue)) {
        return _.chain(objValue)
            .concat(srcValue)
            .uniq()
            .value()
    }
}
