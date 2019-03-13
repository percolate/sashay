var Code = require('components/code.jsx')
var createElement = require('react').createElement
var expect = require('chai').expect
var fromJS = require('immutable').fromJS
var merge = require('lodash/merge')
var Parameters = require('components/parameters.jsx')
var PayloadController = require('components/payload-controller.jsx')
var Request = require('components/request.jsx')

describe('components/request.jsx', function() {
    var options

    beforeEach(function() {
        options = {
            initialRoute: fromJS({}),
            method: {
                absoluteUri: 'example.com',
                displayName: 'foo',
                method: 'get',
                securedBy: ['oauth2'],
                slug: 'foo',
            },
        }
    })

    describe('render', function() {
        it('should render', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(Request, options)
            )
            expect(wrapper).to.not.contain(
                createElement('h1', undefined, 'Form data')
            )
        })

        it('should render form data but not cURL example', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Request,
                    merge(options, {
                        method: {
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
                    })
                )
            )
            expect(wrapper.text()).to.include('Form data')
            expect(wrapper.text()).to.not.include('Example curl request')
            expect(wrapper.find('h1')).to.have.lengthOf(1)
        })

        it('should render payload, example, URI params, query params', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Request,
                    merge(options, {
                        method: {
                            body: {
                                'application/json': {
                                    example: JSON.stringify({}),
                                    payload: {},
                                },
                            },
                            queryParameters: {},
                            uriParameters: {},
                        },
                    })
                )
            )
            expect(wrapper.find(PayloadController).length).to.equal(1)
            expect(wrapper.find(Parameters).length).to.equal(2)
            expect(wrapper.find(Code).length).to.equal(1)
        })
    })
})
