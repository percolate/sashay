var _ = require('lodash')
var helper = require('./helper')
var util = require('util')

var SLUG_SEPARATOR = '.'
var CODE_RE_TEMPLATE = /^```([a-z]*?)$([\s\S]*?)^```/m
var DEFAULT_CODE_LANG = 'sh'
var TRIM_NEWLINE_RE = /^\s+|\s+$/g
var ANCHOR_RE = /(?:#)(.*?)(?=\s*\))/g

module.exports = function (options) {
    var topics = _.chain(options.schema.documentation())
        .filter(function (doc) {
            return !_.isEmpty(doc.title()) && !_.isEmpty(doc.content().value())
        })
        .map(function (doc) {
            var content = doc.content().value().replace(/\r/g, '')
            return {
                displayName: doc.title(),
                contents: splitContent(content),
                slug: ['topic', doc.title()].join(SLUG_SEPARATOR).toLowerCase(),
            }
        })
        .value()
    var dataTypes = options.schema.RAMLVersion() === 'RAML10' ? prepareDataTypes(options.schema) : {}
    var transformedDocs = _.chain({
        baseUri: options.schema.baseUri().value(),
        title: options.schema.title(),
        version: options.schema.version(),
    })
    .extend({
        topics: topics,
        groups: _.chain(options.schema.resources())
            .map(function (rootResource) {
                var methods = getMethods('', [], dataTypes, rootResource)
                var definitionSchema = _.chain(methods)
                    .filter(function (method) {
                        return method.method === 'post'
                    })
                    .map(function (method) {
                        return helper.getSuccessResponseFromMethod(method)
                    })
                    .compact()
                    .first()
                    .value()
                if (definitionSchema) {
                    var schema = {}
                    if (!_.isNil(definitionSchema.type)) {
                        schema = getProperties(definitionSchema.type, dataTypes)
                    } else {
                        schema = _.get(definitionSchema, 'schema')
                    }
                    methods.unshift({
                        displayName: 'Definition',
                        slug: rootResource.relativeUri().value().split('/').concat('definition').join(SLUG_SEPARATOR).substring(1),
                        body: {
                            'application/json': {
                                schema: schema,
                            },
                        },
                    })
                }
                return _.chain({
                    description: _.isNil(rootResource.description()) ? null : rootResource.description().value(),
                    displayName: rootResource.displayName(),
                    methods: methods,
                    slug: 'method'.concat((rootResource.relativeUri().value().split('/')).join(SLUG_SEPARATOR)),
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

function getProperties (types, dataTypes) {
    var schema = {}
    _.forEach(types, function (type) {
        if (_.get(dataTypes, type)) {
            _.forEach(dataTypes[type].allProperties, function (property) {
                if (!property.isPrimitive()) {
                    _.extend(schema, getProperties(dataTypes[property.domain().nameId()][property.nameId()].type, dataTypes))
                } else {
                    schema[property.nameId()] = _.omit(dataTypes[property.domain().nameId()][property.nameId()], 'allProperties')
                }
            })
        }
    })
    return schema
}
function getMethods (relativeUri, relativeUriPathSegments, dataTypes, resource) {
    var resources = resource.resources() || []
    var methods = resource.methods() || []
    var absoluteUriPathSegments = relativeUriPathSegments.concat(_.filter(resource.relativeUri().value().substring(1).split('/'), function (part) {
        return part !== ''
    }))
    var options = { serializeMetadata: false }
    var absoluteUri = relativeUri + resource.relativeUri().value()
    var uriParameters = {}
    _.forEach(resource.uriParameters(), function (parameter) {
        uriParameters[parameter.displayName()] = _.omit(parameter.toJSON(options), [
            'name',
            'repeat',
        ])
        if (_.isArray(uriParameters[parameter.displayName()].type)) {
            if (!_.isEmpty(uriParameters[parameter.displayName()].type)) {
                uriParameters[parameter.displayName()].type = uriParameters[parameter.displayName()].type[0]
            } else {
                throw new Error(util.format('Type for %s is required', parameter.displayName()))
            }
        }
    })

    return _.chain(methods)
        .map(function (method) {
            var responses = {}
            var jsonMethod = method.toJSON(options)
            _.forEach(jsonMethod.responses, function (response, key) {
                var object = _.chain(response).get('body').get('application/json').value()
                if (!_.isNil(object)) {
                    response.body['application/json'] = _.omit(object, [
                        'displayName',
                        'repeat',
                        'required',
                        'name',
                        'schemaContent',
                        'structuredExample',
                    ])
                    if (_.isArray(response.body['application/json'].schema)) {
                        response.body['application/json'].schema = response.body['application/json'].schema[0]
                    }
                    if (!_.isNil(response.body['application/json'].type)) {
                        response.body['application/json'].schema = _.omit(dataTypes[response.body['application/json'].type], 'allProperties')
                        response.body['application/json'].example = dataTypes[response.body['application/json'].type].example
                    }
                }
                responses[key] = _.omit(response, 'code')
            })

            if (!_.isNil(jsonMethod.body)) {
                if (_.isArray(jsonMethod.body['application/json'].schema)) {
                    jsonMethod.body['application/json'].schema = jsonMethod.body['application/json'].schema[0]
                }
                if (!_.isNil(jsonMethod.body['application/json'].type)) {
                    if (_.isNil(dataTypes[jsonMethod.body['application/json'].type[0]])) {
                        throw new Error(util.format('No supertype found for %s in %s', jsonMethod.body['application/json'].type[0], absoluteUri))
                    }
                    jsonMethod.body['application/json'].schema = {}
                    _.forEach(dataTypes[jsonMethod.body['application/json'].type[0]].allProperties, function (property) {
                        jsonMethod.body['application/json'].schema[property.nameId()] = _.omit(dataTypes[property.domain().nameId()][property.nameId()], 'allProperties')
                    })
                    jsonMethod.body['application/json'].example = dataTypes[jsonMethod.body['application/json'].type[0]].example
                }
            }
            var transformedMethod = _.chain(jsonMethod)
                .omit([
                    'protocols',
                ])
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method()).join(SLUG_SEPARATOR),
                })
                .extend(!_.isEmpty(responses) ? {
                    responses: responses,
                } : null)
                .extend(!_.isEmpty(uriParameters) ? {
                    uriParameters: uriParameters,
                } : null)
                .value()
            return transformedMethod
        })
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments, dataTypes)) || [])
        .flatten()
        .value()
}

function prepareDataTypes (schema) {
    var dataTypes = {}
    _.forEach(schema.types(), function (type) {
        if (type.kind() === 'ObjectTypeDeclaration' || type.kind() === 'TypeDeclaration') {
            dataTypes[type.name()] = {}
            _.forEach(type.properties(), function (prop) {
                var format = null
                if (typeof prop.format === 'function') {
                    format = { format: prop.format() }
                }
                if (typeof prop.pattern === 'function') {
                    format = { pattern: prop.pattern() }
                }
                dataTypes[type.name()][prop.name()] = _.chain({
                    default: prop.default(),
                    description: _.isNil(prop.description()) ? null : prop.description().value(),
                    displayName: prop.displayName(),
                    required: prop.required(),
                    type: prop.type(),
                })
                .extend(typeof prop.enum === 'function' && !_.isEmpty(prop.enum()) ? {
                    enum: prop.enum(),
                } : null)
                .extend(format)
                .value()
                dataTypes[type.name()].allProperties = type.runtimeDefinition().allProperties()
                dataTypes[type.name()].example = type.example()
            })
        }
    })
    return dataTypes
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
