var _ = require('lodash')
var BPromise = require('bluebird')
var buildRAML = require('../lib/expand').buildRAML
var expand = require('../lib/expand')
var expect = require('chai').expect
var fs = require('fs-extra')
var path = require('path')

describe('expand()', function () {
    this.timeout(10e3)

    it('should throw invalid RAML error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.name).to.equal('YAMLError')
                return done()
            })
            .caught(done)
    })

    it('should throw invalid root error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-root.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at ".": .*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid root resource error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-root-resource.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at ".a": .*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid oneof title error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-oneof.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^.*oneOf does not contain 'title' property.*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid method error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at ".a.get": .*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid method response example error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-example.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Example response does not validate against schema at ".a.get": .*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid method request example error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-request-example.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Example request does not validate against schema at ".a.post": .*/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid schemas error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-schemas.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^schemas property must be an array/)
                return done()
            })
            .caught(done)
    })

    it('should run', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid/index.raml'),
        }
        expand(options)
            .then(function (res) {
                var resBody = _.get(res, [
                    'resources',
                    0,
                    'resources',
                    0,
                    'resources',
                    0,
                    'methods',
                    0,
                    'responses',
                    201,
                    'body',
                    'application/json',
                ])
                expect(resBody.schema).to.equal('{\n  \"allOf\": [\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"a\": {\n          \"type\": \"string\"\n        }\n      }\n    },\n    {\n      \"type\": \"object\",\n      \"properties\": {\n        \"b\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"required\": [\n       \       "d\"\n            ],\n            \"properties\": {\n              \"c\": {\n                \"description\": \"my object description\",\n                \"type\": \"string\"\n              },\n              \"d\": {\n                \"description\": \"a unique ID\",\n                \"type\": \"integer\"\n              }\n            }\n          }\n        }\n      }\n    }\n  ]\n}')
                expect(resBody.example).to.equal('{\n  \"a\": \"hello\",\n  \"b\": [\n    {\n      \"c\": \"description\",\n      \"d\": 123\n    },\n    {\n      \"c\": \"description\",\n      \"d\": 456\n    }\n  ]\n}')
                return done()
            })
            .caught(done)
    })

    it('should not filter private but strip out tags', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
        }
        BPromise.resolve()
            .then(expand.bind(undefined, options))
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    '\nprivate content\n\nJust a foo description\n\nprivate content\n',
                    'Just a private description',
                ])
                return done()
            })
            .caught(done)
    })

    it('should filter private', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
            publicOnly: true,
        }
        BPromise.resolve()
            .then(expand.bind(undefined, options))
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    'Just a foo description\n',
                ])
                return done()
            })
            .caught(done)
    })

    it('should expand to raml', function (done) {
        var result = fs.readFileSync(path.resolve(__dirname, 'fixtures/dereference/result.raml'), 'utf8')
        var options = {
            destination: path.resolve(__dirname, 'tmp'),
            quiet: true,
            source: path.resolve(__dirname, 'fixtures/dereference/index.raml'),
        }
        BPromise.resolve()
            .then(buildRAML.bind(undefined, options))
            .then(function () {
                var raml = fs.readFileSync(path.resolve(options.destination, 'index.raml'), 'utf8')
                expect(raml).to.equal(result, 'RAML format does not match fixture')
                fs.removeSync(options.destination)
                done()
            })
            .caught(done)
    })
})
