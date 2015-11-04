var _ = require('lodash')
var helper = require('./helper')
var path = require('path')

var SLUG_SEPARATOR = '.'

module.exports = function (options) {
    var topics = _.chain(options.schema.documentation)
        .filter(function (doc) {
            return !_.isEmpty(doc.title) && !_.isEmpty(doc.content)
        })
        .map(function (doc) {
            return {
                displayName: doc.title,
                content: doc.content,
                slug: ['topic', doc.title].join(SLUG_SEPARATOR).toLowerCase(),
            }
        })
        .value()
    return _.chain(options.schema)
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
                    var definitionSchema = _.chain(methods)
                        .filter(function (method) {
                            return method.method === 'post'
                        })
                        .map(function (method) {
                            return _.get(helper.getSuccessResponseFromMethod(method), 'schema')
                        })
                        .compact()
                        .first()
                        .value()
                    if (definitionSchema) {
                        methods.unshift({
                            displayName: 'Definition',
                            slug: rootResource.relativeUriPathSegments.concat('definition').join(SLUG_SEPARATOR),
                            body: {
                                'application/json': {
                                    schema: definitionSchema,
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
                .value(),
        })
        .value()
}

function getMethods (relativeUri, relativeUriPathSegments, resource) {
    var resources = resource.resources || []
    var methods = resource.methods || []
    var absoluteUriPathSegments = relativeUriPathSegments.concat(resource.relativeUriPathSegments)
    var absoluteUri = path.join(relativeUri, resource.relativeUri)
    return _.chain(methods)
        .map(function (method) {
            return _.chain(method)
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method).join(SLUG_SEPARATOR),
                })
                .extend(_.pick(resource, [
                    'uriParameters',
                ]))
                .value()
        })
        .concat(resources.map(getMethods.bind(_, absoluteUri, absoluteUriPathSegments)) || [])
        .flatten()
        .value()
}
