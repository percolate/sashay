var fromJS = require('immutable').fromJS
var get = require('lodash/get')
var has = require('lodash/has')

exports.isVisible = isVisible
exports.parsePayload = parsePayload

function isVisible (el) {
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

function parsePayload (keyPath, payload) {
    return keyPath.reduceRight(function (reduction, key, i) {
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
            return reduction.unshift(fromJS({
                key: schemaKey,
                schemaKeyPath: partialKeyPath,
                type: type,
            }))
        }
        return reduction
    }, fromJS([]))
}