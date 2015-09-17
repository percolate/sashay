var _ = require('lodash')
var expand = require('../lib/expand')
var expect = require('chai').expect
var transform = require('../lib/transform')

describe('transform()', function () {
    it('should transform the schema', function (done) {
        var options = {
            source: {
                swagger: '2.0',
                host: 'foo',
                info: {
                    title: 'foo',
                    version: '1.0.0',
                },
                paths: {
                    '/a': {
                        get: {
                            tags: ['y'],
                            summary: 'A',
                            description: 'A.',
                            parameters: [
                                {
                                    in: 'query',
                                    name: 'ids',
                                    required: true,
                                    type: 'array',
                                    collectionFormat: 'csv',
                                    items: {
                                        type: 'string',
                                    },
                                    description: 'The ids.',
                                },
                            ],
                            responses: {
                                200: {
                                    description: 'A success.',
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            a: {
                                                type: 'number',
                                            },
                                        },
                                        example: {
                                            a: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '/b': {
                        post: {
                            tags: ['y'],
                            summary: 'B',
                            description: 'B.',
                            parameters: [
                                {
                                    in: 'body',
                                    name: 'body',
                                    schema: {
                                        type: 'object',
                                        required: [
                                            'value',
                                        ],
                                        properties: {
                                            value: {
                                                type: 'string',
                                                description: 'The value.',
                                            },
                                        },
                                    },
                                },
                            ],
                            responses: {
                                200: {
                                    description: 'B success.',
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            b: {
                                                type: 'number',
                                            },
                                        },
                                        example: {
                                            b: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '/c/{id}': {
                        put: {
                            tags: ['z'],
                            summary: 'C',
                            description: 'C.',
                            parameters: [
                                {
                                    in: 'path',
                                    name: 'id',
                                    required: true,
                                    type: 'string',
                                    description: 'The id.',
                                },
                                {
                                    in: 'body',
                                    name: 'body',
                                    schema: {
                                        type: 'object',
                                        required: [
                                            'value',
                                        ],
                                        properties: {
                                            value: {
                                                type: 'string',
                                                description: 'The value.',
                                            },
                                        },
                                    },
                                },
                            ],
                            responses: {
                                200: {
                                    description: 'C success.',
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            c: {
                                                type: 'number',
                                            },
                                        },
                                        example: {
                                            c: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                tags: [
                    {
                        name: 'y',
                        description: 'Y',
                    },
                    {
                        name: 'z',
                        description: 'Z',
                    },
                ],
            },
        }
        expand(options)
            .then(function (schema) {
                _.extend(options, { schema: schema })
                expect(transform(options).groups).to.deep.equal([
                    {
                        name: 'y',
                        description: 'Y',
                        operations: [
                            {
                                slug: 'A',
                                verb: 'get',
                                path: '/a',
                                tags: ['y'],
                                summary: 'A',
                                description: 'A.',
                                parameters: [
                                    {
                                        in: 'query',
                                        name: 'ids',
                                        required: true,
                                        type: 'array',
                                        collectionFormat: 'csv',
                                        items: {
                                            type: 'string',
                                        },
                                        description: 'The ids.',
                                    },
                                ],
                                responses: {
                                    200: {
                                        description: 'A success.',
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                a: {
                                                    type: 'number',
                                                },
                                            },
                                            example: {
                                                a: 1,
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                slug: 'B',
                                verb: 'post',
                                path: '/b',
                                tags: ['y'],
                                summary: 'B',
                                description: 'B.',
                                parameters: [
                                    {
                                        in: 'body',
                                        name: 'body',
                                        schema: {
                                            type: 'object',
                                            required: [
                                                'value',
                                            ],
                                            properties: {
                                                value: {
                                                    type: 'string',
                                                    description: 'The value.',
                                                },
                                            },
                                        },
                                    },
                                ],
                                responses: {
                                    200: {
                                        description: 'B success.',
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                b: {
                                                    type: 'number',
                                                },
                                            },
                                            example: {
                                                b: 1,
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                    {
                        name: 'z',
                        description: 'Z',
                        operations: [
                            {
                                slug: 'C',
                                verb: 'put',
                                path: '/c/{id}',
                                tags: ['z'],
                                summary: 'C',
                                description: 'C.',
                                parameters: [
                                    {
                                        in: 'path',
                                        name: 'id',
                                        required: true,
                                        type: 'string',
                                        description: 'The id.',
                                    },
                                    {
                                        in: 'body',
                                        name: 'body',
                                        schema: {
                                            type: 'object',
                                            required: [
                                                'value',
                                            ],
                                            properties: {
                                                value: {
                                                    type: 'string',
                                                    description: 'The value.',
                                                },
                                            },
                                        },
                                    },
                                ],
                                responses: {
                                    200: {
                                        description: 'C success.',
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                c: {
                                                    type: 'number',
                                                },
                                            },
                                            example: {
                                                c: 1,
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                ])
                return done()
            })
            .caught(done)
    })
})
