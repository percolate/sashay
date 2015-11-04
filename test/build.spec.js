var build = require('../lib/')
var expect = require('chai').expect
var path = require('path')

var SOURCE = path.resolve(__dirname, './fixtures/valid/index.raml')
var DESTINATION = path.resolve(__dirname, './fixtures/temp/build/')

describe('build()', function () {
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

    it('should build web', function (done) {
        this.timeout(10e3)
        var options = {
            quiet: true,
            output: 'web',
            destination: DESTINATION,
            source: SOURCE,
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(done)
    })
})
