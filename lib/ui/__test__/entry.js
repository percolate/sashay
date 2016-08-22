var Bluebird = require('bluebird')
var chai = require('chai')
var ReactMounter = require('./react-mounter')
var sinonChai = require('sinon-chai')

Bluebird.onPossiblyUnhandledRejection(function (err) {
    throw err
})

chai.config.truncateThreshold = 0
chai.use(sinonChai)

beforeEach(function () {
    this.reactMounter = new ReactMounter()
})

afterEach(function () {
    this.reactMounter.unmountAll()
})

require('./controller.spec')
