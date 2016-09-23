var createElement = require('react').createElement
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Request = require('components/request.jsx')

describe('components/request.jsx', function () {
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
            var wrapper = this.reactMounter.shallow(createElement(Request, options))
            expect(wrapper).to.not.contain(createElement('h1', undefined, 'Form data'))
        })

        it('should render form data but not cURL example', function () {
            var wrapper = this.reactMounter.shallow(createElement(Request, extend(options, {
                method: {
                    displayName: 'foo',
                    method: 'post',
                    absoluteUri: 'example.com',
                    securedBy: ['oauth2'],
                    body: {
                        'application/x-www-form-urlencoded': {
                            formParameters: {
                                hello: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                    slug: 'foo',
                },
            })))
            expect(wrapper).to.contain(createElement('h1', undefined, 'Form data'))
            expect(wrapper).to.not.contain(createElement('h1', undefined, 'Example curl request'))
        })
    })
})
