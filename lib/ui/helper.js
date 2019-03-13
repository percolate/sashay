var _ = require('lodash')
var authorizationHeaders = require('../cli/constants').authorizationHeaders
var fromJS = require('immutable').fromJS
var get = require('lodash/get')
var has = require('lodash/has')
var Route = require('route-parser')

var ROUTE = new Route('/:slug(/:parameterType/:parameterPath)')
var HASH_PREFIX = '#'

exports.addRequiredQueryParameters = addRequiredQueryParameters
exports.getCurl = getCurl
exports.getHashFromPathname = getHashFromPathname
exports.getHashFromRoute = getHashFromRoute
exports.getPathnameFromRoute = getPathnameFromRoute
exports.isVisible = isVisible
exports.parsePayload = parsePayload
exports.parseRoute = parseRoute

function getHashFromRoute(route) {
    return getHashFromPathname(getPathnameFromRoute(route))
}

function getHashFromPathname(pathname) {
    return HASH_PREFIX + pathname
}

function getPathnameFromRoute(route) {
    return ROUTE.reverse(route.toJS())
}

function isVisible(el) {
    var rect = el.getBoundingClientRect()
    var containmentRect = {
        top: 0,
        left: 0,
        bottom: window.innerHeight || document.documentElement.clientHeight,
        right: window.innerWidth || document.documentElement.clientWidth,
    }
    var visibilityRect = {
        top: rect.top >= containmentRect.top,
        left: rect.left >= containmentRect.left,
        bottom: rect.bottom <= containmentRect.bottom,
        right: rect.right <= containmentRect.right,
    }
    return (
        visibilityRect.top &&
        visibilityRect.left &&
        visibilityRect.bottom &&
        visibilityRect.right
    )
}

function parsePayload(keyPath, payload) {
    return keyPath.reduceRight(function(reduction, key, i) {
        var partialKeyPath = keyPath.slice(0, i + 1)
        var val = get(payload, partialKeyPath)
        var schemaKey
        var type
        if (has(val, 'object')) {
            if (partialKeyPath.slice(-3)[0] === 'array') {
                schemaKey = partialKeyPath.slice(-5)[0]
                type = 'array'
            } else {
                schemaKey = partialKeyPath.slice(-2)[0]
                type = 'object'
            }
            return reduction.unshift(
                fromJS({
                    key: schemaKey,
                    schemaKeyPath: partialKeyPath,
                    type: type,
                })
            )
        }
        return reduction
    }, fromJS([]))
}

function parseRoute(pathname) {
    var route = ROUTE.match(pathname)
    if (!route) return fromJS({})
    return fromJS(route)
}

function addRequiredQueryParameters(url, method, params) {
    var queryString = _.chain(params)
        .map(function(param, key) {
            if (param.required) {
                return `${key}={${key}}`
            }
        })
        .compact()
        .join('&')
        .value()

    return queryString ? `${url}?${queryString}` : url
}

function getCurl(url, method, securedBy) {
    var firstSecuredBy = _.isString(securedBy[0])
        ? securedBy[0]
        : _.chain(securedBy[0])
              .keys()
              .first()
              .value()
    var authHeader = authorizationHeaders[firstSecuredBy].id
    return _.chain([
        `curl "${url}"`,
        `  -X "${method.toUpperCase()}"`,
        authHeader ? `  -H "Authorization: ${authHeader}"` : undefined,
        '  -H "Content-type: application/json; charset=utf-8"',
        method === 'put' || method === 'post' ? "  -d '{body}'" : undefined,
    ])
        .compact()
        .join(' \\\n')
        .value()
}
