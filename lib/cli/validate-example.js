var _ = require('lodash')
var Ajv = require('ajv')

var WHITELISTED_ERROR_PARAMS = [
    'keyword',
    'dataPath',
    'schemaPath',
    'message',
    'data',
]

module.exports = function(schema, data, callback) {
    if (_.isString(schema)) schema = JSON.parse(schema)
    if (_.isString(data)) data = JSON.parse(data)

    var ajv = new Ajv({
        allErrors: true,
        verbose: true,
    })
    ajv.validate(schema, data)
    if (_.isFunction(callback)) {
        var errors = ajv.errors ? [] : undefined
        _.each(ajv.errors, function(error) {
            errors.push(_.pick(error, WHITELISTED_ERROR_PARAMS))
        })
        callback(errors)
    }
}
