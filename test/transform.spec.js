var _ = require('lodash')
var expand = require('../lib/expand')
var expect = require('chai').expect
var transform = require('../lib/transform')
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
                            displayName: 'foo',
                            methods: [
                                {
                                    body: {
                                        'application/json': {
                                            schema: '{\n  \"type\": \"object\",\n  \"properties\": {\n    \"a\": {\n      \"type\": \"string\"\n    }\n  }\n}',
                                        },
                                    },
                                    displayName: 'Definition',
                                    slug: 'foo.definition',
                                },
                                {
                                    absoluteUri: '/foo/{foo_id}',
                                    displayName: 'foo',
                                    method: 'post',
                                    responses: {
                                        201: {
                                            body: {
                                                'application/json': {
                                                    schema: '{\n  \"type\": \"object\",\n  \"properties\": {\n    \"a\": {\n      \"type\": \"string\"\n    }\n  }\n}',
                                                },
                                            },
                                        },
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
                                        201: {
                                            body: {
                                                'application/json': {
                                                    example: '{\n  \"a\": \"hello\"\n}',
                                                    schema: '{\n  \"type\": \"object\",\n  \"properties\": {\n    \"a\": {\n      \"type\": \"string\"\n    }\n  }\n}',
                                                },
                                            },
                                        },
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
                            content: '## Hello\n\nWorld\n\n\n!!!\n\n',
                            displayName: 'foo',
                            examples: [
                                'sh\ncurl -X GET -H \"someurl\"\n',
                                'json\n{\n  \"key\": \"value\"\n}\n'
                            ],
                            slug: 'topic.foo',
                        },
                    ],
                    version: 'foo',
                })
                return done()
            })
            .caught(done)
    })
})
