var App = require('components/app.jsx')
var createElement = require('react').createElement
var fromJS = require('immutable').fromJS

describe('components/app.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            baseUri: '',
            groups: [],
            initialRoute: fromJS({}),
            topics: [],
            version: '',
        }
    })

    describe('render()', function () {
        it('should render', function () {
            this.reactMounter.shallow(createElement(App, options))
        })
    })
})
