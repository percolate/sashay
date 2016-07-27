var _ = require('lodash')
var helper = require('./helper')
var splitContent = require('./helper.js').splitContent
var TYPES = require('./constants').types

var DEFAULT_SUBTYPE_TITLE = 'Subtype'

var METADATA = {
    string: ['enum', 'pattern'],
}

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
}

module.exports = transform

function transformAllOf (schema) {
    return transform(helper.mergeAllOf(schema))
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
    }
}

function transformArray (schema) {
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
        example: transformExample(schema),
        properties: properties,
    }
}

function transformExample (schema) {
    return schema.example ? JSON.stringify(schema.example, null, 2) : undefined
}

function transformScalar (schema, type) {
    var output = {
        description: splitContent(schema.description),
        example: transformExample(schema),
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
    var oneOfs = helper.mergeOneOf(schema)
    if (oneOfs.length > 1 && schema.type) {
        oneOfs.unshift(_.merge({}, _.omit(schema, 'oneOf'), { title: 'abstract' }))
    }
    var types = _.groupBy(oneOfs, function (item) {
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
