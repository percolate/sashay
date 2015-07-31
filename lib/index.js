var _ = require('lodash')
var builder = require('./builder')
var Joi = require('joi')
var parser = require('./parser')
var path = require('path')

var OPTIONS_SCHEMA = Joi.object().keys({
    destination: Joi.string().default('./build/'),
    extension: Joi.string(),
    filename: Joi.string().default('reference.md'),
    filter: Joi.array().items(Joi.string()),
    schema: Joi.string().required(),
    watch: Joi.boolean().default(false),
}).required()

exports.build = build
exports.parse = parser.parse

function build (options) {
    var validation = Joi.validate(options, OPTIONS_SCHEMA)
    if (validation.error) throw new Error(validation.error)
    options = normalizePaths(validation.value)
    return builder
        .build(options)
        .then(function () {
            if (!options.watch) return
            return builder.watch(options)
        })
}

function normalizePaths (options) {
    return _.mapValues(options, function (val, key) {
        if (key === 'destination') return path.resolve(process.cwd(), val)
        if (key === 'extension') return path.resolve(process.cwd(), val)
        if (key === 'schema') return path.resolve(process.cwd(), val)
        return val
    })
}
