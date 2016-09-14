var createElement = require('react').createElement
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Method = require('components/method.jsx')

var PARAMETER_TYPES = require('constants').parameterTypes

describe('components/method.jsx', function () {
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

    describe('componentWillMount()', function () {
        it('should noop if not the routed method', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                route: fromJS({
                    slug: 'not the current method',
                }),
            })))
            expect(wrapper.state('activeTab')).to.equal('Request')
        })

        it('should set the "request" tab when mounted with a request parameter type', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                initialRoute: fromJS({
                    parameterType: PARAMETER_TYPES.query.id,
                    slug: 'foo',
                }),
            })))
            expect(wrapper.state('activeTab')).to.equal('Request')
        })

        it('should set the "response" tab when mounted with a response parameter type', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                initialRoute: fromJS({
                    parameterType: PARAMETER_TYPES.response.id,
                    slug: 'foo',
                }),
            })))
            expect(wrapper.state('activeTab')).to.equal('Response')
        })

        it('should set the parameterPath on response payload', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                initialRoute: fromJS({
                    parameterPath: 'a.b.c',
                    parameterType: PARAMETER_TYPES.response.id,
                    slug: 'foo',
                }),
            })))
            expect(wrapper.state('responsePayload').currPath).to.deep.equal([
                'root',
                'a',
                'b',
            ])
        })

        it('should set the parameterPath on request payload', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                initialRoute: fromJS({
                    parameterPath: 'a.b.c',
                    parameterType: PARAMETER_TYPES.payload.id,
                    slug: 'foo',
                }),
            })))
            expect(wrapper.state('requestPayload').currPath).to.deep.equal([
                'root',
                'a',
                'b',
            ])
        })
    })

    describe('render', function () {
        it('should render form data but not cURL example', function () {
            var wrapper = this.reactMounter.shallow(createElement(Method, extend(options, {
                method: {
                    displayName: 'foo',
                    method: 'post',
                    absoluteUri: 'example.com',
                    securedBy: 'oauth2',
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
