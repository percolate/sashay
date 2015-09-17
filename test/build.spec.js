var build = require('../lib/')
var expect = require('chai').expect
var path = require('path')

describe('build()', function () {
    it('should throw for invalid options', function (done) {
        build({})
            .caught(function (err) {
                expect(err).to.be.an.instanceof(Error)
                return done()
            })
    })

    it('should build json', function (done) {
        var options = {
            output: 'json',
            destination: path.resolve(__dirname, './fixtures/json/actual/'),
            source: path.resolve(__dirname, './fixtures/swagger.yml'),
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(done)
    })

    it('should build json and watch', function (done) {
        var options = {
            output: 'json',
            watch: true,
            destination: path.resolve(__dirname, './fixtures/json-watch/actual/'),
            source: path.resolve(__dirname, './fixtures/swagger.yml'),
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(done)
    })

    it('should build web', function (done) {
        this.timeout(10e3)
        var options = {
            output: 'web',
            destination: path.resolve(__dirname, './fixtures/web/actual/'),
            source: path.resolve(__dirname, './fixtures/swagger.yml'),
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(function (err) {
                console.log(err.stack)
                return done(err)
            })
    })

    it('should build web and watch', function (done) {
        this.timeout(10e3)
        var options = {
            output: 'web',
            watch: true,
            destination: path.resolve(__dirname, './fixtures/web-watch/actual/'),
            source: path.resolve(__dirname, './fixtures/swagger.yml'),
        }
        build(options)
            .then(done.bind(undefined, undefined))
            .caught(function (err) {
                console.log(err.stack)
                return done(err)
            })
    })
})
