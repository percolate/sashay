var _ = require('lodash')
var BPromise = require('bluebird')
var expand = require('../lib/expand')
var expect = require('chai').expect
var path = require('path')
var copySourcesToTemp = require('../').copySourcesToTemp

describe('expand()', function () {
    this.timeout(10e3)

    it('should throw invalid RAML error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid.raml'),
        }
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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
        copySourcesToTemp(options, 'test')
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

    it('should filter public by description tag', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
            publicOnly: false,
        }
        copySourcesToTemp(options, 'test')
        BPromise.resolve()
            .then(expand.bind(undefined, options))
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    '#public Just a foo description',
                    'Just a private description',
                ])
                return done()
            })
            .caught(done)
    })

    it('should filter private by description tag', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
            publicOnly: true,
        }
        copySourcesToTemp(options, 'test')
        BPromise.resolve()
            .then(expand.bind(undefined, options))
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    'Just a foo description',
                ])
                return done()
            })
            .caught(done)
    })
})
