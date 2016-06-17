var _ = require('lodash')
var util = require('util')

var SUCCESS_CODE_RE = /^2\d{2}/

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getCurl = getCurl
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod
exports.addRequiredQueryParameters = addRequiredQueryParameters
exports.isTypeObject = isTypeObject
exports.isTypeArray = isTypeArray

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

function isTypeObject (type) {
    return type === 'object' || _.includes(type, 'object')
}

function isTypeArray (type) {
    return type === 'array' || _.includes(type, 'array')
}

function addRequiredQueryParameters (baseUri, method) {
    var uri = baseUri + method.absoluteUri
    _.map(method.queryParameters, function (parameter) {
        if (parameter.required || parameter.displayName === 'scope_ids') uri = uri + (_.includes(uri, '?') ? '&' : '?') + util.format('%s={%s}', parameter.displayName, parameter.displayName)
    })
    return uri
}
