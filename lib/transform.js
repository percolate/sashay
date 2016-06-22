var _ = require('lodash')
var merge = require('deepmerge')
var util = require('util')

var SLUG_SEPARATOR = '.'
var CODE_RE_TEMPLATE = /^```([a-z]*?)$([\s\S]*?)^```/m
var DEFAULT_CODE_LANG = 'sh'
var TRIM_NEWLINE_RE = /^\s+|\s+$/g
var ANCHOR_RE = /(?:#)(.*?)(?=\s*\))/g

module.exports = function (options) {
    if (!options.schema.documentation) {
        options.schema.documentation = []
    }

    options.schema.documentation.push({
        title: 'Download',
        content: `Percolate API is generated from RAML (Restful APIs Markup Language), a human and machine readable API definition enabling the creation of automated and reusable ecosystems of tools.
        The Percolate API RAML definition will help you automate your work interacting with Percolate API, importing it into testing tools (like Postman or Paw) or monitoring tools (like SoapUI, Runscope or APIscience) and work efficiently with the large ecosystem or RAML plugins.
        Download the Percolate RAML file [here](index.raml).`,
    })
    var topics = _.chain(options.schema.documentation)
        .filter(function (doc) {
            return !_.isEmpty(doc.title) && !_.isEmpty(doc.content)
        })
        .map(function (doc) {
            var content = doc.content.replace(/\r/g, '')
            return {
                displayName: doc.title,
                contents: splitContent(content),
                slug: ['topic', doc.title].join(SLUG_SEPARATOR).toLowerCase(),
            }
        })
        .value()
    var transformedDocs = _.chain(options.schema)
        .pick([
            'baseUri',
            'title',
            'version',
        ])
        .extend({
            topics: topics,
            groups: _.chain(options.schema.resources)
                .map(function (rootResource) {
                    var methods = getMethods('', [], rootResource)
                    var definitionSchema = _.get(options.schema.schemas[0], _.last(rootResource.relativeUriPathSegments))
                    if (definitionSchema) {
                        var schema = transform(JSON.parse(definitionSchema))
                        methods.unshift({
                            displayName: 'The ' + _.last(rootResource.relativeUriPathSegments).replace(/_/g, ' ') + ' object',
                            slug: rootResource.relativeUriPathSegments.concat('definition').join(SLUG_SEPARATOR),
                            body: {
                                'application/json': {
                                    schema: schema,
                                },
                            },
                        })
                    }
                    return _.chain(rootResource)
                        .pick([
                            'description',
                            'displayName',
                        ])
                        .extend({
                            methods: methods,
                            slug: ['method'].concat(rootResource.relativeUriPathSegments).join(SLUG_SEPARATOR),
                        })
                        .value()
                })
                .sortBy(function (group) {
                    return _.get(group, 'displayName')
                })
                .value(),
        })
        .value()
    var allMethods = _.chain(transformedDocs.groups)
        .map(function (group) {
            return _.map(group.methods, function (method) {
                return method.slug
            })
            .concat(group.slug)
        })
        .flatten()
        .value()
    _.forEach(transformedDocs.groups, function (group) {
        validateAnchors(group, allMethods)
    })
    return transformedDocs
}

function splitContent (content, output, currIndex) {
    if (!output) output = []
    if (!currIndex) currIndex = 0

    var matches = content.match(CODE_RE_TEMPLATE)

    if (currIndex > content.length) return output

    if (_.isArray(matches)) {
        var codeBlock = matches[0]
        var lang = matches[1] || DEFAULT_CODE_LANG
        var code = matches[2]
        var index = matches.index

        output.push({
            type: 'text',
            text: content.substring(currIndex, index).replace(TRIM_NEWLINE_RE, ''),
        })

        output.push({
            type: 'code',
            lang: lang,
            text: code.replace(TRIM_NEWLINE_RE, ''),
        })

        return splitContent(content.substring(index + codeBlock.length), output, currIndex)
    } else {
        var trimmedContent = content.replace(TRIM_NEWLINE_RE, '')
        if (trimmedContent) {
            output.push({
                type: 'text',
                text: trimmedContent,
            })
        }
    }

    return output
}

function getMethods (relativeUri, relativeUriPathSegments, resource) {
    var resources = resource.resources || []
    var methods = resource.methods || []
    var absoluteUriPathSegments = relativeUriPathSegments.concat(resource.relativeUriPathSegments)
    var absoluteUri = relativeUri + resource.relativeUri
    return _.chain(methods)
        .map(function (method) {
            var schema = null
            if (_.has(method, ['body', 'application/json', 'schema'])) {
                schema = transform(JSON.parse(method.body['application/json'].schema))
            }
            return _.chain(method)
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method).join(SLUG_SEPARATOR),
                })
                .extend(_.pick(resource, [
                    'uriParameters',
                ]))
                .extend(schema ? {
                    body: {
                        'application/json': {
                            schema: schema,
                        },
                    },
                } : null)
                .value()
        })
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments)) || [])
        .flatten()
        .value()
}

function transform (schema) {
    var transformed = {}
    if (_.has(schema, 'oneOf')) {
        if (!_.has(schema, 'type')) {
            transformed = transformOneOf(schema, false)
        } else {
            transformed = transformOneOf(schema, true)
        }
    } else if (_.has(schema, 'type')) {
        if (schema.type === 'object') {
            _.extend(transformed, transformObject(schema))
        } else {
            var types = _.isArray(schema.type) ? schema.type : [schema.type]
            _.extend(transformed, {
                types: transformBasedOnType(schema, types),
            })
        }
    }
    return transformed
}

function transformBasedOnType (schema, types) {
    var transformedTypes = _.map(types, function (type) {
        var transformed = {}
        switch (type) {
            case 'object':
                transformed = transformObject(schema)
                break
            case 'array':
                transformed = transformArray(schema)
                break
            default:
                transformed = transformScalar(schema, type)
        }
        return [type, transformed]
    })
    return _.fromPairs(transformedTypes)
}

function transformScalar (schema, type) {
    if (type === null) {
        type = 'null'
    }
    return (type === 'null') ? _.pick(schema, ['description', 'title']) : _.omit(schema, ['type', 'properties'])
}

function transformOneOf (schema, merging) {
    var transformed = {
        types: {},
    }
    _.forEach(schema.oneOf, function (oneOf) {
        if (!oneOf.title) {
            throw new Error(util.format('Property "title" is missing for oneOf in schema %s: ', JSON.stringify(oneOf)))
        }
    })
    if (!merging) {
        var types = _.chain(schema.oneOf)
            .groupBy(function (item) {
                return item.type
            })
            .value()
        if (Object.keys(types).length === 1) {
            _.forEach(schema.oneOf, function (oneOf) {
                transformed.types[oneOf.title] = transform(oneOf)
            })
        } else {
            _.forEach(types, function (array, type) {
                var mappedTypes = _.map(array, function (item) {
                    return type === 'null' ? { description: 'null' } : _.omit(item, 'type')
                })
                transformed.types[type] = mappedTypes.length === 1 ? mappedTypes[0] : mappedTypes
            })
        }
        _.extend(transformed, _.pick(schema, ['description', 'type']))
    } else {
        _.forEach(schema.oneOf, function (oneOf) {
            var merged = merge(_.omit(schema, 'oneOf'), oneOf)
            transformed.types[oneOf.title] = transform(merged)
        })
    }
    return transformed
}

function transformArray (schema) {
    return _.chain(schema)
        .pick('description')
        .extend({
            types: transform(_.get(schema, 'items', {})),
        })
        .value()
}

function transformObject (schema) {
    var transformed = _.pick(schema, ['description', 'title'])
    var properties = {}
    _.forEach(_.get(schema, 'properties'), function (prop, key) {
        properties[key] = transform(prop)
        properties[key].required = isRequired(schema, key)
    })
    _.extend(transformed, !_.isEmpty(properties) ? {
        properties: properties,
    } : null)

    return transformed
}

function isRequired (schema, key) {
    return _.has(schema, 'required') ? _.includes(schema.required, key) : false
}

function validateAnchors (group, methodNames) {
    var match
    while ((match = ANCHOR_RE.exec(group.description))) {
        var anchor = _.get(match, 1)
        if (!_.includes(methodNames, anchor)) {
            throw new Error(util.format('A link in %s section points to the invalid anchor %s', group.displayName, anchor))
        }
    }
}
