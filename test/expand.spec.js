var expand = require('../lib/expand')
var path = require('path')

describe('expand()', function () {
    it('should run test schema without errors', function (done) {
        var options = {
            source: path.resolve(__dirname, './fixtures/raml-basic/index.raml'),
        }
        expand(options)
            .then(function () {
                return done()
            })
            .caught(done)
    })
})
