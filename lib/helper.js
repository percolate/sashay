var _ = require('lodash')
var util = require('util')

var SUCCESS_CODE_RE = /^2\d{2}/
var DEFAULT_CODE_LANG = 'sh'
var CODE_RE_TEMPLATE = /^```([a-z]*?)$([\s\S]*?)^```/m
var TRIM_NEWLINE_RE = /^\s+|\s+$/g

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getCurl = getCurl
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod
exports.addRequiredQueryParameters = addRequiredQueryParameters
exports.splitContent = splitContent
exports.mergeAllOf = mergeAllOf
exports.mergeOneOf = mergeOneOf

function getCurl (absoluteUri, method, apiKey) {
    var hasBody = (method === 'PUT' || method === 'POST')
    return [
        util.format('curl %s \\', absoluteUri),
        util.format('  -X %s \\', method),
        util.format('  -H "Authorization: %s" \\', apiKey),
        '  -H "Content-type: application/json; charset=utf-8"' + (hasBody ? ' \\' : ''),
        (hasBody ? '  -d \'EXAMPLE_REQUEST_BODY\'' : ''),
    ]
    .join('\n')
    .replace(/ \\$/, '')
}

function getSuccessResponseFromMethod (obj) {
    return _.chain(obj)
        .get([
            'responses',
        ])
        .find(function (val, key) {
            return key.match(SUCCESS_CODE_RE)
        })
        .get([
            'body',
            'application/json',
        ])
        .value()
}

function addRequiredQueryParameters (baseUri, method) {
    var uri = baseUri + method.absoluteUri
    _.map(method.queryParameters, function (parameter) {
        if (parameter.required || parameter.displayName === 'scope_ids') uri = uri + (_.includes(uri, '?') ? '&' : '?') + util.format('%s={%s}', parameter.displayName, parameter.displayName)
    })
    return uri
}

function splitContent (content, output, currIndex) {
    if (!content) {
        return undefined
    }
    if (!output) output = []
    if (!currIndex) currIndex = 0

    var matches = content.match(CODE_RE_TEMPLATE)

    if (currIndex > content.length) return output

    if (_.isArray(matches)) {
        var codeBlock = matches[0]
        var lang = matches[1] || DEFAULT_CODE_LANG
        var code = matches[2]
        var index = matches.index

        output.push({
            type: 'text',
            text: content.substring(currIndex, index).replace(TRIM_NEWLINE_RE, ''),
        })

        output.push({
            type: 'code',
            lang: lang,
            text: code.replace(TRIM_NEWLINE_RE, ''),
        })

        return splitContent(content.substring(index + codeBlock.length), output, currIndex)
    } else {
        var trimmedContent = content.replace(TRIM_NEWLINE_RE, '')
        if (trimmedContent) {
            output.push({
                type: 'text',
                text: trimmedContent,
            })
        }
    }

    return output
}

function mergeOneOf (schema) {
    var oneOfs = schema.oneOf

    // merge root keys with oneOfs
    // ex. `type` and `properties` will be merged with each object inside `oneOf`
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

    return oneOfs
}

function mergeAllOf (schema) {
    var merged = _.omit(schema, 'allOf')
    _.forEach(schema.allOf, function (item) {
        merged = _.mergeWith(merged, item, schemaMerge)
    })

    return merged
}

function schemaMerge (objValue, srcValue) {
    if (_.isArray(objValue) && _.isArray(srcValue)) {
        return _.chain(objValue)
            .concat(srcValue)
            .uniq()
            .value()
    }
}
