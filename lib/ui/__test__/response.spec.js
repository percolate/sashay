var createElement = require('react').createElement
var Code = require('components/code.jsx')
var Dropdown = require('components/dropdown-controller.jsx')
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var merge = require('lodash/merge')
var PayloadController = require('components/payload-controller.jsx')
var Response = require('components/response.jsx')

describe('components/response.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            initialRoute: fromJS({}),
            method: {
                absoluteUri: 'example.com',
                displayName: 'foo',
                method: 'get',
                responses: {
                    200: {},
                    400: {},
                },
                securedBy: ['oauth2'],
                slug: 'foo',
            },
        }
    })

    describe('componentWillMount()', function () {
        it('should noop if initialRoute not defined', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, extend(options, {
                initialRoute: undefined,
            })))
            expect(wrapper.state('statusCode')).to.equal('200')
        })

        it('should noop if parameterType not present in method', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, extend(options, {
                initialRoute: fromJS({
                    parameterType: 'bogus parameterType',
                }),
            })))
            expect(wrapper.state('statusCode')).to.equal('200')
        })

        it('should set statusCode', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, extend(options, {
                initialRoute: fromJS({
                    parameterType: '400',
                }),
            })))
            expect(wrapper.state('statusCode')).to.equal('400')
        })
    })

    describe('onChangeStatus()', function () {
        it('should set the satus', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, options))
            wrapper.find(Dropdown).prop('onChange')('400')
            expect(wrapper.state('statusCode')).to.equal('400')
        })
    })

    describe('render()', function () {
        it('should render', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, options))
            expect(wrapper.state('statusCode')).to.equal('200')
        })

        it('should render payload', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, merge(options, {
                method: {
                    responses: {
                        200: {
                            body: {
                                'application/json': {
                                    payload: {},
                                },
                            },
                        },
                    },
                },
            })))
            expect(wrapper.find(PayloadController).length).to.equal(1)
        })

        it('should render example', function () {
            var wrapper = this.reactMounter.shallow(createElement(Response, merge(options, {
                method: {
                    responses: {
                        200: {
                            body: {
                                'application/json': {
                                    example: JSON.stringify({ hello: 'world' }),
                                },
                            },
                        },
                    },
                },
            })))
            expect(wrapper.find(Code).length).to.equal(1)
        })
    })
})
