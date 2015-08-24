var _ = require('lodash')
var path = require('path')

module.exports = function (options, properties) {
    return _.mapValues(options, function (val, key) {
        if (_.contains(properties, key)) return path.resolve(process.cwd(), val)
        return val
    })
}
