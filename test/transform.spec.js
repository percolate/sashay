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
                            description: 'My description [here](#foo.{foo_id}.post)\n1. my item in the list\n  section 1\n2. my item in the list\n  section 2\n3. my item in the list\n',
                            displayName: 'foo',
                            methods: [
                                {
                                    body: {
                                        'application/json': {
                                            properties: {
                                                a: {
                                                    displayName: 'a',
                                                    required: false,
                                                    type: 'string',
                                                },
                                                b: {
                                                    displayName: 'b',
                                                    items: {
                                                        type: 'object',
                                                    },
                                                    required: false,
                                                    type: 'array',
                                                },
                                                c: {
                                                    description: 'my object description',
                                                    displayName: 'c',
                                                    required: false,
                                                    type: 'string',
                                                },
                                                d: {
                                                    description: 'a unique ID',
                                                    displayName: 'd',
                                                    required: true,
                                                    type: 'integer',
                                                },
                                            },
                                            schema: '{\n  \"allOf\": [\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"a\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"b\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"required\": [\n       \       "d\"\n            ],\n            \"properties\": {\n              \"c\": {\n                \"description\": \"my object description\",\n                \"type\": \"string\"\n              },\n              \"d\": {\n                \"description\": \"a unique ID\",\n                \"type\": \"integer\"\n              }\n            }\n          }\n        }\n      }\n    }\n  ]\n}',
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
                                                    schema: '{\n  \"allOf\": [\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"a\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"b\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"required\": [\n       \       "d\"\n            ],\n            \"properties\": {\n              \"c\": {\n                \"description\": \"my object description\",\n                \"type\": \"string\"\n              },\n              \"d\": {\n                \"description\": \"a unique ID\",\n                \"type\": \"integer\"\n              }\n            }\n          }\n        }\n      }\n    }\n  ]\n}',
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
                                                    example: '{\n  \"a\": \"hello\",\n  \"b\": [\n    {\n      \"c\": \"description\",\n      \"d\": 123\n    },\n    {\n      \"c\": \"description\",\n      \"d\": 456\n    }\n  ]\n}',
                                                    schema: '{\n  \"allOf\": [\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"a\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"b\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"required\": [\n       \       "d\"\n            ],\n            \"properties\": {\n              \"c\": {\n                \"description\": \"my object description\",\n                \"type\": \"string\"\n              },\n              \"d\": {\n                \"description\": \"a unique ID\",\n                \"type\": \"integer\"\n              }\n            }\n          }\n        }\n      }\n    }\n  ]\n}',
                                                },
                                            },
                                        },
                                    },
                                    slug: 'foo.{foo_id}.bar.get',
                                },
                                {
                                    absoluteUri: '/foo/{foo_id}/baz',
                                    displayName: 'foo',
                                    method: 'get',
                                    responses: {
                                        201: {
                                            body: {
                                                'application/json': {
                                                    example: '{\n  \"a\": \"hello\",\n  \"b\": [\n    {\n      \"c\": \"description\",\n      \"d\": 123\n    },\n    {\n      \"c\": \"description\",\n      \"d\": 456\n    }\n  ]\n}',
                                                    schema: '{\n  \"allOf\": [\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"a\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"b\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"required\": [\n       \       "d\"\n            ],\n            \"properties\": {\n              \"c\": {\n                \"description\": \"my object description\",\n                \"type\": \"string\"\n              },\n              \"d\": {\n                \"description\": \"a unique ID\",\n                \"type\": \"integer\"\n              }\n            }\n          }\n        }\n      }\n    }\n  ]\n}',
                                                },
                                            },
                                        },
                                    },
                                    slug: 'foo.{foo_id}.baz.get',
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
                    ],
                    version: 'foo',
                })
                return done()
            })
            .caught(done)
    })

    it('should not transform', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid-anchor.raml'),
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
})
