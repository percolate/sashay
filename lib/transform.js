var _ = require('lodash')
var helper = require('./helper')
var path = require('path')
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
            groups: _.chain(options.schema.resources)
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
                                    schema: _.get(definitionSchema, 'schemaContent'),
                                },
                            },
                        })
                    }
                    return _.chain({
                            description: rootResource.description,
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
    var absoluteUri = path.join(relativeUri, resource.relativeUri().value())
    return _.chain(methods)
        .map(function (method) {
            var json = method.toJSON()
            var allQueryParameters = {}
            _.forEach(method.is(), function (is) {
                _.forEach(_.get(is.trait().toJSON({ serializeMetadata: false }), 'queryParameters'), function (value, key){
                    allQueryParameters[key] = value
                })
            })
            _.extend(allQueryParameters, _.get(json, 'queryParameters'))
            return _.chain({
                    description: _.isNil(method.description()) ? method.displayName() : method.description().value(),
                    displayName: method.displayName(),
                    method: method.method(),
                    securedBy: _.get(json, 'securedBy'),
                    responses: _.get(json, 'responses'),
                    protocols: _.get(json, 'protocols'),
                    queryParameters: allQueryParameters,
                    body: _.get(json, 'body'),
                })
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method()).join(SLUG_SEPARATOR),
                    uriParameters: _.get(resource.toJSON(), 'uriParameters'),
                })
                .value()
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
