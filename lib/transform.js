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

    var transformedDocs = _.chain({
        baseUri: options.schema.baseUri().value(),
        title: options.schema.title(),
        version: options.schema.version(),
    })
    .extend({
        topics: topics,
        groups: _.chain(options.schema.resources())
            .map(function (rootResource) {
                var methods = getMethods('', [], rootResource)
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
                    methods.unshift({
                        displayName: 'Definition',
                        slug: rootResource.relativeUri().value().split('/').concat('definition').join(SLUG_SEPARATOR).substring(1),
                        body: {
                            'application/json': {
                                schema: _.get(definitionSchema, 'schema'),
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

function getMethods (relativeUri, relativeUriPathSegments, resource) {
    var resources = resource.resources() || []
    var methods = resource.methods() || []
    var absoluteUriPathSegments = relativeUriPathSegments.concat(_.filter(resource.relativeUri().value().substring(1).split('/'), function (part) {
        return part !== ''
    }))
    var options = { serializeMetadata: false }
    var absoluteUri = relativeUri + resource.relativeUri().value()
    var parameters = _.map(resource.uriParameters(), function (parameter) {
        var param = _.omit(parameter.toJSON(options), [
            'name',
            'repeat',
        ])
        if (_.isArray(param.type)) {
            if (!_.isEmpty(param.type)) {
                param.type = param.type[0]
            } else {
                throw new Error(util.format('Type for %s is required', parameter.displayName()))
            }
        }
        return param
    })
    var uriParameters = _.zipObject(_.map(parameters, function (parameter) {
        return parameter.displayName
    }), parameters)

    return _.chain(methods)
        .map(function (method) {
            var jsonMethod = method.toJSON(options)
            var responseArray = _.map(jsonMethod.responses, function (response) {
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
                }
                return response
            })
            var responses = _.zipObject(_.map(responseArray, function (response) {
                return response.code
            }), _.map(responseArray, function (res) {
                return _.omit(res, 'code')
            }))

            if (!_.isNil(jsonMethod.body) && _.isArray(jsonMethod.body['application/json'].schema)) {
                jsonMethod.body['application/json'].schema = jsonMethod.body['application/json'].schema[0]
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
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments)) || [])
        .flatten()
        .value()
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
