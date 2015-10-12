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
                return done()
            })
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
                return done()
            })
    })

    it('should throw for missing summary but support parameters', function (done) {
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
                return done()
            })
    })

    it('should throw for invalid request example', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        post: {
                            summary: 'n/a',
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
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                return done()
            })
    })

    it('should throw for invalid response example', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
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
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                return done()
            })
    })

    it('should throw for invalid `x-` attributes', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
                            responses: {
                                200: {
                                    description: '',
                                },
                            },
                            'x-public': true,
                            'x-whatever': 'whatever...',
                        },
                    },
                },
            }),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                return done()
            })
    })

    it('should expand without examples', function (done) {
        var options = {
            source: _.merge({}, BASE, {
                paths: {
                    '/foo': {
                        get: {
                            summary: 'n/a',
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
                                responses: {
                                    200: {
                                        description: '',
                                    },
                                },
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
                            },
                        },
                    },
                })
                return done()
            })
            .caught(done)
    })
})
