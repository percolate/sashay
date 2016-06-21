var _ = require('lodash')
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
                        var schema = getProperties(JSON.parse(definitionSchema))
                        methods.unshift({
                            displayName: 'The ' + _.last(rootResource.relativeUriPathSegments).replace(/_/g, ' ') + ' object',
                            slug: rootResource.relativeUriPathSegments.concat('definition').join(SLUG_SEPARATOR),
                            body: {
                                'application/json': {
                                    properties: _.extend(schema, {
                                        isExpandable: isExpandable(schema),
                                        description: '',
                                    }),
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

function isExpandable (schema) {
    return _.chain(schema)
        .map(function (value) {
            return (isTypeObject(value.type) && !_.isEmpty(value.properties))
                || (isTypeArray(value.type) && isTypeObject(value.items.type))
        })
        .includes(true)
        .value()
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
            if (_.has(method, ['body', 'application/json', 'schema'])) {
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
                            properties: _.extend(properties, {
                                isExpandable: isExpandable(properties),
                                description: '',
                            }),
                        },
                    },
                } : null)
                .value()
        })
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments)) || [])
        .flatten()
        .value()
}

function createProperty (prop, propName, requiredProperties) {
    return _.chain(prop)
        .pick([
            'description',
            'enum',
            'pattern',
        ])
        .extend({
            displayName: propName,
            required: _.includes(requiredProperties, propName),
        })
        .extend(isTypeArray(prop.type) ? {
            type: 'array',
            items: {
                type: _.get(prop.items, 'type', 'string'),
            },
        } : {
            type: prop.type ? prop.type : 'string',
        })
        .value()
}

function isTypeObject (type) {
    return type === 'object' || _.includes(type, 'object')
}

function isTypeArray (type) {
    return type === 'array' || _.includes(type, 'array')
}

function processProperty (prop, propName, requiredProperties) {
    var properties = {}
    if (isTypeObject(prop.type)) {
        _.extend(properties, getProperties(prop))
    }
    if (isTypeArray(prop.type) && _.has(prop, 'items') && isTypeObject(prop.items.type)) {
        _.extend(properties, getProperties(prop.items))
    }

    return [
        propName,
        _.extend(createProperty(prop, propName, requiredProperties), !_.isEmpty(properties) ? {
            properties: properties,
        } : null),
    ]
}

function getProperties (jsonSchema) {
    var schema = {}
    var properties = _.chain(_.get(jsonSchema, 'properties'))
        .map(function (prop, propName) {
            return processProperty(prop, propName, _.get(jsonSchema, 'required'))
        })
        .compact()
        .value()
    _.extend(schema, _.fromPairs(properties))
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
