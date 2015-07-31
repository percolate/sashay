var assertDir = require('assert-dir-equal')
var expect = require('chai').expect
var fs = require('fs-extra')
var sashay = require('../')
var path = require('path')

var SCHEMA = path.resolve(__dirname, './fixtures/swagger.yaml')

describe('sashay', function () {

    describe('build()', function () {

        it('should build with options', function (done) {
            var buildPath = path.resolve(__dirname, './fixtures/basic/actual/')
            var options = {
                destination: buildPath,
                filename: 'my-output.md',
                schema: SCHEMA,
            }
            fs.emptyDirSync(buildPath)
            sashay.build(options)
                .then(function () {
                    assertDir('test/fixtures/basic/expected', 'test/fixtures/basic/actual')
                    return done()
                })
                .caught(done)
        })

        it('should build with extension', function (done) {
            var buildPath = path.resolve(__dirname, './fixtures/extension/actual/')
            var options = {
                destination: buildPath,
                extension: path.resolve(__dirname, './fixtures/extension.md'),
                schema: SCHEMA,
            }
            fs.emptyDirSync(buildPath)
            sashay.build(options)
                .then(function () {
                    assertDir('test/fixtures/extension/expected', 'test/fixtures/extension/actual')
                    return done()
                })
                .caught(done)
        })

    })

    describe('parse()', function () {

        it('should parse the Swagger schema', function (done) {
            var options = {
                schema: SCHEMA,
            }
            sashay.parse(options)
                .then(function (res) {
                    expect(res).to.deep.equal({
                        basePath: '/v5',
                        extension: undefined,
                        methodGroups: [
                            {
                                name: '/charge',
                                methods: [
                                    {
                                        description: 'n/a',
                                        name: 'DELETE',
                                        parameters: [],
                                        pathname: '/charge',
                                        slug: 'delete-charge',
                                        tags: [
                                            'public',
                                        ],
                                        verb: 'delete',
                                    },
                                    {
                                        description: 'To charge a credit card, you create a charge object. If your API key is in test mode, the supplied payment source (e.g., card or Bitcoin receiver) won\'t actually be charged, though everything else will occur as if in live mode. (Stripe assumes that the charge would have completed successfully).\n',
                                        name: 'GET',
                                        parameters: [
                                            {
                                                description: 'A positive integer in the smallest currency unit (e.g 100 cents to charge $1.00, or 1 to charge ¥1, a 0-decimal currency) representing how much to charge the card. The minimum amount is $0.50 (or equivalent in charge currency).\n',
                                                name: 'otp_secret_setup_token',
                                                required: true,
                                                type: 'string',
                                            },
                                        ],
                                        pathname: '/charge',
                                        slug: 'get-charge',
                                        tags: [
                                            'stable',
                                        ],
                                        verb: 'get',
                                    },
                                    {
                                        description: 'n/a',
                                        name: 'POST',
                                        parameters: [
                                            {
                                                name: 'scope_id',
                                                required: true,
                                                type: '[string]',
                                            },
                                            {
                                                name: 'source',
                                                required: false,
                                                type: 'string',
                                            },
                                            {
                                                name: 'target',
                                                required: true,
                                                type: 'string',
                                            },
                                            {
                                                name: 'text',
                                                required: true,
                                                type: 'string',
                                            },
                                        ],
                                        pathname: '/charge',
                                        slug: 'post-charge',
                                        tags: [
                                            'deprecated',
                                        ],
                                        verb: 'post',
                                    },
                                ],
                                slug: 'charge',
                            },
                        ],
                        host: 'api.percolate.com',
                        info: {
                            title: 'Percolate API Reference',
                            version: '5.0.0',
                        },
                        schemes: [
                            'https',
                        ],
                    })
                    return done()
                })
                .caught(done)
        })

        it('should filter operations by tag', function (done) {
            var options = {
                filter: ['public'],
                schema: SCHEMA,
            }
            sashay.parse(options)
                .then(function (res) {
                    expect(res.methodGroups[0].methods).to.deep.equal([
                        {
                            description: 'n/a',
                            name: 'DELETE',
                            parameters: [],
                            pathname: '/charge',
                            slug: 'delete-charge',
                            tags: [
                                'public',
                            ],
                            verb: 'delete',
                        },
                    ])
                    return done()
                })
                .caught(done)
        })

    })

})
