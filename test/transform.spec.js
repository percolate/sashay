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
                                            payload: {
                                                object: [{
                                                    description: undefined,
                                                    properties: {
                                                        b: {
                                                            required: false,
                                                            types: {
                                                                array: [{
                                                                    description: undefined,
                                                                    types: {
                                                                        object: [{
                                                                            title: 'abstract',
                                                                            description: undefined,
                                                                            properties: {
                                                                                c: {
                                                                                    required: false,
                                                                                    types: {
                                                                                        string: [{
                                                                                            description: [{
                                                                                                text: 'my object description',
                                                                                                type: 'text',
                                                                                            }],
                                                                                            pattern: undefined,
                                                                                            enum: undefined,
                                                                                        }],
                                                                                        null: [{
                                                                                            description: [{
                                                                                                text: 'my object description',
                                                                                                type: 'text',
                                                                                            }],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                                d: {
                                                                                    required: true,
                                                                                    types: {
                                                                                        integer: [{
                                                                                            description: [{
                                                                                                text: 'a unique ID',
                                                                                                type: 'text',
                                                                                            }],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                                g: {
                                                                                    required: false,
                                                                                    types: {
                                                                                        string: [{
                                                                                            description: undefined,
                                                                                            pattern: undefined,
                                                                                            enum: ['val1', 'val2'],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                        {
                                                                            title: 'Subtype 2',
                                                                            description: undefined,
                                                                            properties: {
                                                                                c: {
                                                                                    required: false,
                                                                                    types: {
                                                                                        string: [{
                                                                                            description: [{
                                                                                                text: 'my object description',
                                                                                                type: 'text',
                                                                                            }],
                                                                                            pattern: undefined,
                                                                                            enum: undefined,
                                                                                        }],
                                                                                        null: [{
                                                                                            description: [{
                                                                                                text: 'my object description',
                                                                                                type: 'text',
                                                                                            }],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                                d: {
                                                                                    required: true,
                                                                                    types: {
                                                                                        integer: [{
                                                                                            description: [{
                                                                                                text: 'a unique ID',
                                                                                                type: 'text',
                                                                                            }],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                                g: {
                                                                                    required: false,
                                                                                    types: {
                                                                                        string: [{
                                                                                            description: undefined,
                                                                                            pattern: undefined,
                                                                                            enum: ['val1', 'val2'],
                                                                                        }],
                                                                                    },
                                                                                },
                                                                                e: {
                                                                                    required: true,
                                                                                    types: {
                                                                                        boolean: [{ description: undefined }],
                                                                                    },
                                                                                },
                                                                            },
                                                                        }],
                                                                    },
                                                                }],
                                                                null: [{ description: undefined }],
                                                            },
                                                        },
                                                    },
                                                }],
                                            },
                                        },
                                    },
                                    displayName: 'The foo object',
                                    slug: 'foo.definition',
                                },
                                {
                                    absoluteUri: '/foo/{foo_id}',
                                    body: {
                                        'application/json': {
                                            payload: {
                                                object: [{
                                                    description: undefined,
                                                    properties: {
                                                        prop: {
                                                            required: false,
                                                            types: {
                                                                object: [{
                                                                    description: undefined,
                                                                    properties: {
                                                                        a: {
                                                                            required: false,
                                                                            types: {
                                                                                object: [{
                                                                                    description: undefined,
                                                                                    properties: {
                                                                                        b: {
                                                                                            required: false,
                                                                                            types: {
                                                                                                integer: [{ description: undefined }],
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                }],
                                                                            },
                                                                        },
                                                                    },
                                                                }],
                                                            },
                                                        },
                                                    },
                                                }],
                                            },
                                        },
                                    },
                                    displayName: 'foo',
                                    method: 'post',
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
})
