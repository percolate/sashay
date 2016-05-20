var _ = require('lodash')
var util = require('util')

var SLUG_SEPARATOR = '.'
var CODE_RE_TEMPLATE = /^```([a-z]*?)$([\s\S]*?)^```/m
var DEFAULT_CODE_LANG = 'sh'
var KEY_WORDS = ['type', 'description', 'example', 'format', 'pattern', 'items', 'additionalProperties', 'properties', 'allOf', 'oneOf', 'required', 'enum']
var TRIM_NEWLINE_RE = /^\s+|\s+$/g
var ANCHOR_RE = /(?:#)(.*?)(?=\s*\))/g

module.exports = function (options) {
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
                    var definitionSchema = _.get(options.schema.schemas[0], rootResource.relativeUriPathSegments[rootResource.relativeUriPathSegments.length - 1])
                    if (definitionSchema) {
                        methods.unshift({
                            displayName: 'Definition',
                            slug: rootResource.relativeUriPathSegments.concat('definition').join(SLUG_SEPARATOR),
                            body: {
                                'application/json': {
                                    schema: definitionSchema,
                                    properties: getProperties(JSON.parse(definitionSchema)),
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
            var properties = null
            if (method.body && method.body['application/json'] && method.body['application/json'].schema) {
                properties = getProperties(JSON.parse(method.body['application/json'].schema))
            }
            return _.chain(method)
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method).join(SLUG_SEPARATOR),
                })
                .extend(_.pick(resource, [
                    'uriParameters',
                ]))
                .extend(properties ? {
                    body: {
                        'application/json': {
                            example: method.body['application/json'].example,
                            properties: properties,
                            schema: method.body['application/json'].schema,
                        },
                    },
                } : null)
                .value()
        })
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments)) || [])
        .flatten()
        .value()
}

function createProperty (prop, propName, required) {
    return _.chain(prop)
        .pick([
            'description',
            'enum',
            'pattern',
        ])
        .extend({
            displayName: propName,
            required: _.includes(required, propName),
        })
        .extend(prop.type === 'array' || prop.items ? {
            type: 'array',
            items: {
                type: prop.items.type ? prop.items.type : 'string',
            },
        } : {
            type: prop.type ? prop.type : 'string',
        })
        .value()
}

function createPropertyArray (prop, propName, required) {
    return [
        propName,
        createProperty(prop, propName, required),
    ]
}

function processProperty (prop, propName, required, schema, simpleProperties) {
    if (_.get(prop, 'allOf') || prop.type === 'object' || (_.includes(prop.type, 'object'))) {
        if (!prop.type) {
            prop.type = 'object'
        }
        _.extend(schema, getProperties(prop))
    }
    if ((prop.type === 'array' || _.includes(prop.type, 'array')) && prop.items.type === 'object') {
        _.extend(schema, getProperties(prop.items))
    }
    if (simpleProperties) {
        for (var key in prop) {
            if (!_.includes(KEY_WORDS, key)) {
                schema[key] = createProperty(_.get(prop, key), key, required)
            }
        }
    }
    return createPropertyArray(prop, propName, required)
}

function getProperties (jsonSchema) {
    var schema = {}
    _.forEach(jsonSchema, function (element, key) {
        var properties = []
        if (key === 'allOf') {
            properties = _.chain(element)
                .map(function (el) {
                    var props = _.get(el, 'properties')
                    return _.map(props, function (prop, propName) {
                        return processProperty(prop, propName, _.get(el, 'required'), schema, false)
                    })
                })
                .flatten()
                .compact()
                .value()
        }
        if (key === 'properties') {
            properties = _.chain(element)
                .map(function (prop, propName) {
                    return processProperty(prop, propName, _.get(jsonSchema, 'required'), schema, true)
                })
                .compact()
                .value()
        }
        _.extend(schema, _.fromPairs(properties))
    })
    return schema
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
