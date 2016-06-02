var _ = require('lodash')
var util = require('util')

var SUCCESS_CODE_RE = /^2\d{2}/

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getCurl = getCurl
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod
exports.addRequiredQueryParameters = addRequiredQueryParameters

function getCurl (absoluteUri, method, apiKey) {
    if (_.includes(absoluteUri, '{')) {
        var uriParts = absoluteUri.split('/')
        uriParts.forEach(function (part, index) {
            if (_.includes(part, '{')) uriParts[index] = part.toUpperCase().substring(1, part.length - 1)
        })
        absoluteUri = uriParts.join('/')
    }
    var hasBody = (method === 'PUT' || method === 'POST')
    return [
        util.format('curl %s \\', absoluteUri),
        util.format('  -X %s \\', method),
        util.format('  -H "Authorization: %s" \\', apiKey),
        '  -H "Content-type: application/json; charset=utf-8"' + (hasBody ?  ' \\' : ''),
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
    var uri = baseUri + method.absoluteUri + (_.includes(method.is, 'licenseScopeIds') ? '?scope_ids=license:1' : '')
    _.map(method.queryParameters, function (parameter) {
        if (parameter.required) uri = uri + (_.includes(uri, '?') ? '&' : '?') + util.format('%s=%s', parameter.displayName, parameter.displayName.toUpperCase())
    })
    return uri
}
