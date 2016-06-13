var build = require('../lib/').build
var expect = require('chai').expect
var fs = require('fs-extra')
var path = require('path')

var SOURCE = path.resolve(__dirname, './fixtures/valid/index.raml')
var DESTINATION = path.resolve(__dirname, './fixtures/temp/build/')

describe('build()', function () {
    this.timeout(1.2 * 10e3)

    afterEach(function () {
        fs.removeSync(DESTINATION)
    })

    it('should throw for invalid options', function (done) {
        var options = {
            output: 'invalid output!',
        }
        build(options)
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                return done()
            })
    })

    it('should build json', function (done) {
        var options = {
            quiet: true,
            destination: DESTINATION,
            source: SOURCE,
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(done)
    })

    it('should build json and watch', function (done) {
        var options = {
            quiet: true,
            watch: true,
            destination: DESTINATION,
            source: SOURCE,
        }
        build(options)
            .then(function (stopAll) {
                return stopAll()
            })
            .then(done.bind(undefined, undefined))
            .caught(done)
    })

    it('should build web', function (done) {
        var options = {
            quiet: true,
            output: 'web',
            destination: DESTINATION,
            source: SOURCE,
        }
        build(options)
            .then(function () {
                fs.access(path.resolve(DESTINATION, 'index.raml'), fs.F_OK, function (err) {
                    expect(err).to.equal(null)
                })
            })
            .then(done.bind(undefined, undefined))
            .caught(done)
    })

    it('should build web and watch', function (done) {
        var options = {
            quiet: true,
            watch: true,
            output: 'web',
            destination: DESTINATION,
            source: SOURCE,
        }
        build(options)
            .then(function (stopAll) {
                return stopAll()
            })
            .then(done.bind(undefined, undefined))
            .caught(done)
    })
})
