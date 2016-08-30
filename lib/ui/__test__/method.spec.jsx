var createElement = require('react').createElement
var expect = require('chai').expect
var Method = require('../components/method.jsx')

describe('components/method.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            baseUri: '/foo',
            method: {
                displayName: 'foo',
                method: 'post',
                body: {
                    'application/x-www-form-urlencoded': {
                        formParameters: {
                            hello: {
                                type: 'string',
                            },
                        },
                    },
                },
            },
        }
    })

    it('should render form data but not cURL example', function () {
        var wrapper = this.reactMounter.shallow(createElement(Method, options))
        expect(wrapper).to.contain(<h1>Form data</h1>)
        expect(wrapper).to.not.contain(<h1>Example curl request</h1>)
    })
})
