var _ = require('lodash')
var BPromise = require('bluebird')
var expand = require('../lib/expand')
var expect = require('chai').expect
var path = require('path')

describe('expand()', function () {
    this.timeout(10e3)

    it('should throw invalid RAML error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.name).to.equal('Error')
                return done()
            })
            .caught(done)
    })

    it('should throw invalid root error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid-root.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at ".": .*/)
                return done()
            })
            .caught(done)
    })

    it('should have root resource', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid-root-resource.raml'),
        }
        expand(options)
            .then(function (res) {
                expect(res.resources().length).to.equal(1)
                expect(res.resources()[0].displayName()).to.equal('/a')
                return done()
            })
            .caught(done)
    })

    it('should throw invalid method error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid-method.raml'),
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
            source: path.resolve(__dirname, './fixtures/invalid-method-response-example.raml'),
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
            source: path.resolve(__dirname, './fixtures/invalid-method-request-example.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Example request does not validate against schema at ".a.post": .*/)
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
                var resBody = _.get(res.toJSON(), [
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
                expect(resBody.schema.length).to.equal(1)
                expect(resBody.schema[0]).to.equal('{\n  "type": "object",\n  "properties": {\n    "a": {\n      "type": "string"\n    }\n  }\n}')
                expect(resBody.example).to.equal('{\n  "a": "hello"\n}')
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
                expect(_.map(res.resources(), function (resource) {
                    return resource.description().value()
                })).to.deep.equal([
                    'private content\n\nJust a foo description\n\nprivate content\n',
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
                expect(_.map(res.resources(), function (resource) {
                    return resource.description().value()
                })).to.deep.equal([
                    'Just a foo description\n',
                ])
                return done()
            })
            .caught(done)
    })
})
