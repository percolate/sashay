var _ = require('lodash')
var BPromise = require('bluebird')
var parser = require('swagger-parser')
var slug = require('slug')

exports.preprocess = preprocess

function preprocess (options) {
    return parse(options.input)
        .spread(function (schema) {
            return _.chain(schema)
                .pick('basePath', 'host', 'info', 'schemes')
                .extend({
                    methodGroups: _.chain(schema.paths)
                        .map(_.bind(getMethodGroup, undefined, options.filter))
                        .compact()
                        .sortBy(nameIterator)
                        .value(),
                })
                .value()
        })
}

function getMethodGroup (filter, pathitem, pathname) {
    var methods = _.chain(pathitem)
        .map(_.bind(getMethod, undefined, pathname))
        .filter(function (method) {
            if (!filter) return true
            return !_.isEmpty(_.intersection(method.tags, filter))
        })
        .sortBy(nameIterator)
        .value()
    if (_.isEmpty(methods)) return undefined
    return {
        methods: methods,
        name: pathname,
        slug: getSlug(pathname),
    }
}

function getMethod (pathname, operation, verb) {
    return {
        description: operation.description,
        name: verb.toUpperCase(),
        parameters: _.chain(operation.parameters)
            .map(getParameter)
            .flatten()
            .sortBy(nameIterator)
            .value(),
        pathname: pathname,
        slug: getSlug([
            verb.toUpperCase(),
            pathname,
        ].join(' ')),
        tags: operation.tags,
        verb: verb,
    }
}

function getParameter (parameter) {
    if (_.has(parameter, 'schema')) return getParametersFromSchema(parameter.schema)
    return _.pick.apply(_, [parameter].concat([
        'description',
        'name',
        'required',
        'type',
    ]))
}

function getParametersFromSchema (schema) {
    return _.chain(schema.properties)
        .map(function (property, name) {
            return {
                name: name,
                required: _.contains(schema.required, name),
                type: (property.type === 'array') ? ['[', ']'].join(property.items.type) : property.type,
            }
        })
        .value()
}

function getSlug (val) {
    return slug(val, { lower: true })
}

function nameIterator (n) {
    return n.name
}

function parse (src) {
    return new BPromise(function (resolve, reject) {
        return parser.parse(src, function (err, res, metadata) {
            if (err) return reject(err)
            return resolve([
                res,
                metadata,
            ])
        })
    })
}
