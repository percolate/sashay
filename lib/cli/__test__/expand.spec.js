var _ = require('lodash')
var BPromise = require('bluebird')
var buildRAML = require('../expand').buildRAML
var expand = require('../expand')
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
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "root"/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid root resource error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-root-resource.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "a"/)
                return done()
            })
            .caught(done)
    })

    it('should throw invalid method error', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "a.get"/)
                return done()
            })
            .caught(done)
    })

    it('should validate response schema', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-schema.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid schema:.*at "a.get.responses.200.body.application\/json.schema"/)
                return done()
            })
            .caught(done)
    })

    it('should validate RAML if options validate is falsey', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-schema.raml'),
        }
        return expand(options)
            .caught(function (err) {
                expect(err).to.equal(undefined)
            })
    })

    it('should validate response example', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-example.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid example at "a.get.responses.200.body.application\/json.example"/)
                return done()
            })
            .caught(done)
    })

    it('should validate request schema', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-request-schema.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid schema:.*at "a.post.body.application\/json.schema"/)
                return done()
            })
            .caught(done)
    })

    it('should validate request example', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-request-example.raml'),
            validate: true,
        }
        expand(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid example at "a.post.body.application\/json.example"/)
                return done()
            })
            .caught(done)
    })

    it('should run', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid/index.raml'),
            validate: true,
        }
        expand(options)
            .then(function (res) {
                var resBody = _.get(res, [
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
                expect(resBody).to.include.keys('schema', 'example')
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
