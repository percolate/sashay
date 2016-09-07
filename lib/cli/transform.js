var _ = require('lodash')
var parseRoute = require('../ui/helper').parseRoute
var splitContent = require('./helper.js').splitContent
var transform = require('./transform-data-type')

var SLUG_SEPARATOR = '.'
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

function getMethods (relativeUri, relativeUriPathSegments, resource) {
    var resources = resource.resources || []
    var methods = resource.methods || []
    var absoluteUriPathSegments = relativeUriPathSegments.concat(resource.relativeUriPathSegments)
    var absoluteUri = relativeUri + resource.relativeUri
    return _.chain(methods)
        .map(function (method) {
            var body = null
            if (_.has(method, 'body')) {
                body = {
                    body: {},
                }
                var jsonSchema = _.get(method, ['body', 'application/json', 'schema'])
                var jsonExample = _.get(method, ['body', 'application/json', 'example'])
                var formParameters = _.get(method, ['body', 'application/x-www-form-urlencoded', 'formParameters'])

                if (jsonSchema || jsonExample) {
                    body.body['application/json'] = {}
                    if (jsonSchema) body.body['application/json'].payload = transform(JSON.parse(jsonSchema))
                    if (jsonExample) body.body['application/json'].example = jsonExample
                }

                if (formParameters) {
                    body.body['application/x-www-form-urlencoded'] = {
                        formParameters,
                    }
                }
            }
            var responseSchemas = _.chain(method.responses)
                .map(function (response, code) {
                    if (!_.has(response, ['body', 'application/json', 'schema']) || _.get(response, ['body', 'application/json', 'schema']) === '{}') return null
                    return [code, {
                        body: {
                            'application/json': {
                                payload: transform(JSON.parse(response.body['application/json'].schema)),
                                example: response.body['application/json'].example,
                            },
                        },
                    }]
                })
                .compact()
                .fromPairs()
                .value()
            return _.chain(method)
                .omit('responses')
                .extend({
                    absoluteUri: absoluteUri,
                    slug: absoluteUriPathSegments.concat(method.method).join(SLUG_SEPARATOR),
                })
                .extend(_.pick(resource, [
                    'uriParameters',
                ]))
                .extend(body ? body : null)
                .extend(!_.isEmpty(responseSchemas) ? {
                    responses: responseSchemas,
                } : null)
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
        if (!_.includes(methodNames, parseRoute(anchor).get('slug'))) {
            throw new Error(`A link in ${group.displayName} section points to the invalid anchor ${anchor}`)
        }
    }
}
