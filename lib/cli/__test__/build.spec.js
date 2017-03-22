var constants = require('../constants')
var build = require('../build')
var expect = require('chai').expect
var fs = require('fs-extra')
var path = require('path')
var BPromise = require('bluebird')

BPromise.promisifyAll(fs)

var SOURCE = path.resolve(__dirname, './fixtures/valid/index.raml')
var DESTINATION = path.resolve(constants.tmpDir, 'tests')

describe('build()', function () {
    this.timeout(30e3)

    it('should throw for invalid options', function () {
        var options = {
            output: 'invalid output!',
        }
        return build(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
            })
    })

    it('should build json', function () {
        var options = {
            quiet: true,
            destination: DESTINATION,
            source: SOURCE,
            validate: false,
        }
        return build(options)
    })

    it('should build raml', function () {
        var options = {
            destination: DESTINATION,
            quiet: true,
            output: ['raml'],
            source: path.resolve(__dirname, 'fixtures/dereference/index.raml'),
            validate: false,
        }
        return build(options)
            .then(function () {
                return fs.accessAsync(path.resolve(DESTINATION, 'index.raml'), fs.F_OK)
                    .then(function (err) {
                        expect(err).to.equal(undefined)
                    })
            })
    })

    it('should build json and watch', function () {
        var options = {
            quiet: true,
            watch: true,
            destination: DESTINATION,
            source: SOURCE,
            validate: false,
        }
        return build(options)
            .then(function (stopAll) {
                return stopAll()
            })
    })

    it('should build web', function () {
        var options = {
            quiet: true,
            output: ['web'],
            destination: DESTINATION,
            source: SOURCE,
            validate: false,
        }
        return build(options)
            .then(function () {
                fs.access(path.resolve(DESTINATION, 'index.raml'), fs.F_OK, function (err) {
                    expect(err).to.equal(null)
                })
            })
    })

    it('should build web and watch', function () {
        var options = {
            quiet: true,
            watch: true,
            output: ['web'],
            destination: DESTINATION,
            source: SOURCE,
            validate: false,
        }
        return build(options)
            .then(function (stopAll) {
                return stopAll()
            })
    })
})
