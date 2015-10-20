var _ = require('lodash')
var expect = require('chai').expect
var expand = require('../lib/expand')

var BASE = {
    swagger: '2.0',
    host: 'a',
    info: {
        title: 'a',
        version: '1.0.0',
    },
}

describe('expand()', function () {
    it('should throw for invalid references', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    $ref: '#/bogus/path',
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('Error resolving $ref pointer "#/bogus/path". \nToken "bogus" does not exist.')
                return done()
            })
            .caught(done)
    })

    it('should throw for invalid swagger', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        post: {},
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('Swagger schema validation failed. \n  Missing required property: responses at paths//foo/post \nJSON_OBJECT_VALIDATION_FAILED')
                return done()
            })
            .caught(done)
    })

    it('should allow parameters', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo/{id}': {
                        parameters: [
                            {
                                in: 'path',
                                name: 'id',
                                required: true,
                                type: 'string',
                                description: 'The id.',
                            },
                        ],
                        get: {
                            summary: 'n/a',
                            tags: ['foo'],
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                        },
                    },
                },
            }),
        }
        expand(options)
            .then(function () {
                return done()
            })
            .caught(done)
    })

    it('should throw for missing summary', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo/': {
                        get: {
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('child "summary" fails because ["summary" is required] at /foo/.get')
                return done()
            })
            .caught(done)
    })

    it('should throw for invalid request example', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        post: {
                            summary: 'n/a',
                            tags: ['foo'],
                            parameters: [
                                {
                                    name: '',
                                    in: 'body',
                                    schema: {
                                        type: 'object',
                                        required: ['foo'],
                                        properties: {
                                            foo: {
                                                type: 'number',
                                            },
                                        },
                                        example: {},
                                    },
                                },
                            ],
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('Example #/foo.post.parameters[n].body.schema.example.[\n  {\n    "keyword": "required",\n    "dataPath": ".foo",\n    "message": "is a required property"\n  }\n] does not match schema')
                return done()
            })
            .caught(done)
    })

    it('should throw for invalid response example', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
                            tags: ['foo'],
                            responses: {
                                200: {
                                    description: '',
                                    schema: {
                                        type: 'object',
                                        required: ['foo'],
                                        properties: {
                                            foo: {
                                                type: 'number',
                                            },
                                        },
                                        example: {},
                                    },
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('Example #/foo.get.responses.200.schema.example.[\n  {\n    "keyword": "required",\n    "dataPath": ".foo",\n    "message": "is a required property"\n  }\n] does not match schema')
                return done()
            })
            .caught(done)
    })

    it('should throw for invalid `x-` attributes', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
                            tags: ['foo'],
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                            'x-whatever': 'whatever...',
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.equal('"x-whatever" is not allowed at /foo.get')
                return done()
            })
            .caught(done)
    })

    it('should expand without examples', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
                            tags: ['foo'],
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                        },
                    },
                },
            }),
        }
        expand(options)
            .then(function (schema) {
                expect(schema).to.deep.equal({
                    swagger: '2.0',
                    host: 'a',
                    info: {
                        title: 'a',
                        version: '1.0.0',
                    },
                    paths: {
                        '/foo': {
                            get: {
                                summary: 'n/a',
                                tags: ['foo'],
                                responses: {
                                    200: {
                                        description: '',
                                    },
                                },
                                'x-deprecated-at': null,
                                'x-public': false,
                            },
                        },
                    },
                })
                return done()
            })
            .caught(done)
    })

    it('should expand with examples', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        post: {
                            summary: 'n/a',
                            tags: ['foo'],
                            parameters: [
                                {
                                    name: '',
                                    in: 'body',
                                    schema: {
                                        type: 'object',
                                        required: ['foo'],
                                        properties: {
                                            foo: {
                                                type: 'number',
                                            },
                                        },
                                        example: {
                                            foo: 1,
                                        },
                                    },
                                },
                            ],
                            responses: {
                                200: {
                                    description: '',
                                    schema: {
                                        type: 'object',
                                        required: ['foo'],
                                        properties: {
                                            foo: {
                                                type: 'number',
                                            },
                                        },
                                        example: {
                                            foo: 1,
                                        },
                                    },
                                },
                            },
                            'x-deprecated-at': null,
                            'x-public': false,
                        },
                    },
                },
            }),
        }
        expand(options)
            .then(function (schema) {
                expect(schema).to.deep.equal({
                    swagger: '2.0',
                    host: 'a',
                    info: {
                        title: 'a',
                        version: '1.0.0',
                    },
                    paths: {
                        '/foo': {
                            post: {
                                summary: 'n/a',
                                tags: ['foo'],
                                parameters: [
                                    {
                                        name: '',
                                        in: 'body',
                                        schema: {
                                            type: 'object',
                                            required: ['foo'],
                                            properties: {
                                                foo: {
                                                    type: 'number',
                                                },
                                            },
                                            example: {
                                                foo: 1,
                                            },
                                        },
                                    },
                                ],
                                responses: {
                                    200: {
                                        description: '',
                                        schema: {
                                            type: 'object',
                                            required: ['foo'],
                                            properties: {
                                                foo: {
                                                    type: 'number',
                                                },
                                            },
                                            example: {
                                                foo: 1,
                                            },
                                        },
                                    },
                                },
                                'x-deprecated-at': null,
                                'x-public': false,
                            },
                        },
                    },
                })
                return done()
            })
            .caught(done)
    })
})
