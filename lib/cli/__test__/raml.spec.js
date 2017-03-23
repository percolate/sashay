var _ = require('lodash')
var buildJSON = require('./utils').buildJSON
var buildRAML = require('./utils').buildRAML
var expect = require('chai').expect
var fs = require('fs-extra')
var path = require('path')

describe('raml', function () {
    this.timeout(10e3)

    it('should throw invalid RAML error', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid.raml'),
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.name).to.equal('YAMLError')
            })
    })

    it('should throw invalid root error', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-root.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "root"/)
            })
    })

    it('should throw invalid root resource error', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-root-resource.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "a"/)
            })
    })

    it('should throw invalid method error', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid RAML at "a.get"/)
            })
    })

    it('should validate response schema', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-schema.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid schema:.*at "a.get.responses.200.body.application\/json.schema"/)
            })
    })

    it('should validate RAML if options validate is falsey', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-schema.raml'),
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.equal(undefined)
            })
    })

    it('should validate response example', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-response-example.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid example at "a.get.responses.200.body.application\/json.example"/)
            })
    })

    it('should validate request schema', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-request-schema.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid schema:.*at "a.post.body.application\/json.schema"/)
            })
    })

    it('should validate request example', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/invalid/invalid-method-request-example.raml'),
            validate: true,
        }
        return buildJSON(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                expect(err.message).to.match(/^Invalid example at "a.post.body.application\/json.example"/)
            })
    })

    it('should run', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid/index.raml'),
            validate: true,
        }
        return buildJSON(options)
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
            })
    })

    it('should not filter private but strip out tags', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
        }
        return buildJSON(options)
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    '# private\nprivate content\n# endprivate\nJust a foo description\n# private\nprivate content\n# endprivate\n',
                    'Just a private description',
                ])
            })
    })

    it('should filter private', function () {
        var options = {
            source: path.resolve(__dirname, './fixtures/valid-private/index.raml'),
            publicOnly: true,
        }
        return buildJSON(options)
            .then(function (res) {
                expect(_.map(res.resources, 'description')).to.deep.equal([
                    'Just a foo description\n',
                ])
            })
    })

    it('should generate a single RAML source', function () {
        var result = fs.readFileSync(path.resolve(__dirname, 'fixtures/dereference/result.raml'), 'utf8')
        var options = {
            source: path.resolve(__dirname, 'fixtures/dereference/index.raml'),
        }
        return buildRAML(options)
            .then(function (source) {
                expect(source).to.equal(result, 'RAML format does not match fixture')
            })
    })
})
