var _ = require('lodash')

var SUCCESS_CODE_RE = /^2\d{2}/

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getBodyFromMethod = getBodyFromMethod
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod

function getBodyFromMethod (obj) {
    return _.get(obj, [
        'body',
        'application/json',
    ])
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
