var _ = require('lodash')
var emptyScalar = require('./utils').emptyScalar
var expand = require('../expand')
var expect = require('chai').expect
var transform = require('../transform')
var path = require('path')

describe('transform()', function () {
    it('should transform', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid/index.raml'),
        }
        expand(options)
            .then(function (res) {
                var data = transform(_.extend(options, { schema: res }))
                expect(data).to.deep.equal({
                    baseUri: 'foo',
                    groups: [
                        {
                            description: 'My description [here](#foo.{foo_id}.post)\n1. my item in the list\n  section 1\n2. my item in the list\n  section 2\n3. my item in the list\n',
                            displayName: 'foo',
                            methods: [
                                {
                                    absoluteUri: '/foo/{foo_id}',
                                    body: getResponse(),
                                    displayName: 'foo',
                                    method: 'post',
                                    responses: {
                                        201: { body: getResponse() },
                                    },
                                    slug: 'foo.{foo_id}.post',
                                    uriParameters: {
                                        foo_id: {
                                            displayName: 'foo_id',
                                            required: true,
                                            type: 'string',
                                        },
                                    },
                                },
                                {
                                    absoluteUri: '/foo/{foo_id}/bar',
                                    displayName: 'foo',
                                    method: 'get',
                                    responses: {
                                        200: { body: getResponse() },
                                    },
                                    slug: 'foo.{foo_id}.bar.get',
                                },
                            ],
                            slug: 'method.foo',
                        },
                    ],
                    title: 'foo',
                    topics: [
                        {
                            displayName: 'foo',
                            contents: [
                                {
                                    text: '## Hello\n\nWorld',
                                    type: 'text',
                                },
                                {
                                    lang: 'sh',
                                    text: 'curl -X GET -H \"someurl\"',
                                    type: 'code',
                                },
                                {
                                    text: '!!!',
                                    type: 'text',
                                },
                                {
                                    lang: 'json',
                                    text: '{\n  \"key\": \"value\"\n}',
                                    type: 'code',
                                },
                                {
                                    text: '`\nThe extra "`" is intentional',
                                    type: 'text',
                                },
                                {
                                    lang: 'sh',
                                    text: '# no type',
                                    type: 'code',
                                },
                            ],
                            slug: 'topic.foo',
                        },
                        {
                            contents: [
                                {
                                    text: 'Percolate API is generated from RAML (Restful APIs Markup Language), a human and machine readable API definition enabling the creation of automated and reusable ecosystems of tools.\n        The Percolate API RAML definition will help you automate your work interacting with Percolate API, importing it into testing tools (like Postman or Paw) or monitoring tools (like SoapUI, Runscope or APIscience) and work efficiently with the large ecosystem or RAML plugins.\n        Download the Percolate RAML file [here](index.raml).',
                                    type: 'text',
                                },
                            ],
                            displayName: 'Download',
                            slug: 'topic.download',
                        },
                    ],
                    version: 'foo',
                })
                return done()
            })
            .caught(done)
    })

    it('should not transform', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-anchor.raml'),
        }
        expand(options)
            .then(function (res) {
                transform(_.extend(options, { schema: res }))
            })
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^A link in foo section points to the invalid anchor foo123.*/)
                return done()
            })
            .caught(done)
    })

    function getResponse () {
        return {
            'application/json': {
                example: '{\n  \"a\": \"hello\"\n}',
                payload: {
                    object: [{
                        description: undefined,
                        example: undefined,
                        properties: {
                            a: {
                                required: false,
                                types: {
                                    string: emptyScalar('string'),
                                },
                            },
                        },
                    }],
                },
            },
        }
    }
})