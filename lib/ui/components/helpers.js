var _ = require('lodash')

var AUTH_HEADERS = require('../../cli/constants').authorizationHeaders

function addRequiredQueryParameters (url, method, params) {
    var queryString = _.chain(params)
        .map(function (param, key) {
            if (param.required || method === 'get' && key === 'scope_ids') {
                return `${key}={${key}}`
            }
        })
        .compact()
        .join('&')
        .value()

    return queryString ? `${url}?${queryString}` : url
}

function getCurl (url, method, securedBy) {
    var firstSecuredBy = _.isString(securedBy[0]) ? securedBy[0] : _.chain(securedBy[0]).keys().first().value()
    var authHeader = AUTH_HEADERS[firstSecuredBy].id
    return _.chain([
        `curl "${url}"`,
        `  -X "${method.toUpperCase()}"`,
        authHeader ? `  -H "Authorization: ${authHeader}"` : undefined,
        '  -H "Content-type: application/json; charset=utf-8"',
        method === 'put' || method === 'post' ? '  -d \'{body}\'' : undefined,
    ])
    .compact()
    .join(' \\\n')
    .value()
}

exports.addRequiredQueryParameters = addRequiredQueryParameters
exports.getCurl = getCurl
