var assertDir = require('assert-dir-equal')
var expect = require('chai').expect
var fs = require('fs-extra')
var lib = require('../')
var path = require('path')
var yaml = require('js-yaml')

var INPUT = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './fixtures/swagger.yml'), 'utf8'))

describe('lib', function () {
    describe('build()', function () {
        this.timeout(20e3)

        it('should build with options', function (done) {
            var destination = path.resolve(__dirname, './fixtures/build/actual/')
            var options = {
                destination: destination,
                input: INPUT,
            }
            fs.emptyDirSync(destination)
            lib.build(options)
                .then(function () {
                    assertDir('test/fixtures/build/expected', 'test/fixtures/build/actual')
                    return done()
                })
                .caught(done)
        })
    })

    describe('preprocess()', function () {
        it('should preprocess the Swagger schema', function (done) {
            var options = {
                input: INPUT,
            }
            lib.preprocess(options)
                .then(function (res) {
                    expect(res).to.deep.equal({
                        basePath: '/v5',
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
                input: INPUT,
            }
            lib.preprocess(options)
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

    describe('template()', function () {
        it('should template with options', function (done) {
            var destination = path.resolve(__dirname, './fixtures/template/actual/')
            var options = {
                destination: destination,
                filename: 'my-output.md',
                input: INPUT,
            }
            fs.emptyDirSync(destination)
            lib.template(options)
                .then(function () {
                    assertDir('test/fixtures/template/expected', 'test/fixtures/template/actual')
                    return done()
                })
                .caught(done)
        })
    })
})
