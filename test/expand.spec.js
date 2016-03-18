var _ = require('lodash')
var BPromise = require('bluebird')
var expand = require('../lib/expand')
var expect = require('chai').expect
var path = require('path')

describe('expand()', function () {
    it('should throw invalid RAML error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid.raml'),
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

    it('should throw invalid root resource error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid-root-resource.raml'),
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at ".a": .*/)
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
                expect(resBody.schema).to.equal('{\n  "type": "object",\n  "properties": {\n    "a": {\n      "type": "string"\n    }\n  }\n}')
                expect(resBody.example).to.equal('{\n  "a": "hello"\n}')
                return done()
            })
            .caught(done)
    })

    it('should optionally filter by description tag', function (done) {
        var source = path.resolve(__dirname, './fixtures/valid-private/index.raml')
        BPromise.resolve()
            .then(expand.bind(undefined, {
                source: source,
            }))
            .then(function (res) {
                expect(_.pluck(res.resources, 'description')).to.deep.equal([
                    '#public Just a foo description',
                    'Just a private description',
                ])
            })
            .then(expand.bind(undefined, {
                filter: 'public',
                source: source,
            }))
            .then(function (res) {
                expect(_.pluck(res.resources, 'description')).to.deep.equal([
                    'Just a foo description',
                ])
                return done()
            })
            .caught(done)
    })
})
