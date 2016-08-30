var Bluebird = require('bluebird')
var chai = require('chai')
var chaiEnzyme = require('chai-enzyme')
var ReactMounter = require('./react-mounter')
var sinonChai = require('sinon-chai')

Bluebird.onPossiblyUnhandledRejection(function (err) {
    throw err
})

chai.config.truncateThreshold = 0
chai.use(sinonChai)
chai.use(chaiEnzyme())

beforeEach(function () {
    this.reactMounter = new ReactMounter()
})

afterEach(function () {
    this.reactMounter.unmountAll()
})

require('./controller.spec')
require('./method.spec.jsx')
