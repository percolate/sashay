var _ = require('lodash')
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

    var object = {
        description: splitContent(schema.description),
        properties: properties,
    }
    if (schema.example) {
        object.example = JSON.stringify(schema.example, null, 2)
    }
    return object
}

function transformScalar (schema, type) {
    var output = {
        description: splitContent(schema.description),
    }

    if (schema.example) {
        output.example = schema.example
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
    if (_.keys(schema).length > 1) {
        var baseSchema = _.omit(schema, 'oneOf')
        oneOfs = _.map(schema.oneOf, function (oneOf) {
            return _.mergeWith({}, baseSchema, oneOf, schemaMerge)
        })
        if (schema.type) {
            oneOfs.unshift(_.merge({}, baseSchema, { title: 'abstract' }))
        }
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

function schemaMerge (objValue, srcValue) {
    if (_.isArray(objValue) && _.isArray(srcValue)) {
        return _.chain(objValue)
            .concat(srcValue)
            .uniq()
            .value()
    }
}
