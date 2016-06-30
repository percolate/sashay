var _ = require('lodash')
var splitContent = require('./helper.js').splitContent

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

var METADATA = {
    string: ['enum', 'pattern'],
}

function transform (schema) {
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
        description: splitContent(schema.description),
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
        description: splitContent(schema.description),
        properties: properties,
    }
}

function transformScalar (schema, type) {
    var output = {
        description: splitContent(schema.description),
    }

    var metadata = METADATA[type]
    if (!metadata) return output

    var transformed = _.chain(schema)
        .pick(metadata)
        .map(function (value, label) {
            if (_.isEmpty(value)) return undefined
            return [label, value]
        })
        .compact()
        .fromPairs()
        .value()

    if (!_.isEmpty(transformed)) {
        output.metadata = transformed
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
    if (schema.type) {
        var baseSchema = _.omit(schema, 'oneOf')
        oneOfs = _.map(schema.oneOf, function (oneOf) {
            return _.mergeWith({}, baseSchema, oneOf, schemaMerge)
        })
        oneOfs.unshift(_.merge({}, baseSchema, { title: 'abstract' }))
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
