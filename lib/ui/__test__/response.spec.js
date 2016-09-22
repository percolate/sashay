var createElement = require('react').createElement
var fromJS = require('immutable').fromJS
var Response = require('components/response.jsx')

describe('components/response.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            initialRoute: fromJS({}),
            method: {
                absoluteUri: 'example.com',
                securedBy: ['oauth2'],
                displayName: 'foo',
                method: 'get',
                slug: 'foo',
            },
        }
    })

    describe('render', function () {
        it('should render', function () {
            this.reactMounter.shallow(createElement(Response, options))
        })
    })
})
