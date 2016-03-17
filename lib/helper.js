var _ = require('lodash')
var util = require('util')

var SUCCESS_CODE_RE = /^2\d{2}/

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getCurl = getCurl
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod

function getCurl (absoluteUri, method, apiKey, data) {
    return [
        util.format('curl %s \\', absoluteUri),
        util.format('  -X %s \\', method),
        util.format('  -H "Authorization: %s" \\', apiKey),
    ]
    .concat(_.map(data, function (val, key, i) {
        return util.format('  -d %s=%s \\', key, _.isString(val) ? util.format('"%s"', val) : val)
    }))
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
