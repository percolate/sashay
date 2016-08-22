var Controller = require('components/controller.jsx')
var createElement = require('react').createElement

describe('components/controller.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            baseUri: '',
            groups: [],
            topics: [],
            version: '',
        }
    })

    describe('render()', function () {
        it('should render', function () {
            this.reactMounter.shallow(createElement(Controller, options))
        })
    })
})
