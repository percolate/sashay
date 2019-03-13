var createElement = require('react').createElement
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Method = require('components/method.jsx')
var Request = require('components/request.jsx')
var Tabs = require('components/tabs.jsx')

var REQUEST_PARAMETER_TYPES = require('../constants').requestParameterTypes

describe('components/method.jsx', function() {
    var options

    beforeEach(function() {
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

    describe('componentWillMount()', function() {
        it('should noop if not the routed method', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Method,
                    extend(options, {
                        route: fromJS({
                            slug: 'not the current method',
                        }),
                    })
                )
            )
            expect(wrapper.state('tab')).to.equal('Request')
        })

        it('should set the "request" tab when mounted without a request parameter type', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Method,
                    extend(options, {
                        initialRoute: fromJS({
                            slug: 'foo',
                        }),
                    })
                )
            )
            expect(wrapper.state('tab')).to.equal('Request')
        })

        it('should set the "request" tab when mounted with a request parameter type', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Method,
                    extend(options, {
                        initialRoute: fromJS({
                            parameterType: REQUEST_PARAMETER_TYPES.query.id,
                            slug: 'foo',
                        }),
                    })
                )
            )
            expect(wrapper.state('tab')).to.equal('Request')
        })

        it('should set the "response" tab when mounted with a response parameter type', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Method,
                    extend(options, {
                        initialRoute: fromJS({
                            parameterType: '200',
                            slug: 'foo',
                        }),
                    })
                )
            )
            expect(wrapper.state('tab')).to.equal('Response')
        })
    })

    describe('onChangeTab()', function() {
        it('should change the tab', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(Method, options)
            )
            wrapper.find(Tabs).prop('onChange')('Request')
            expect(wrapper.state('tab')).to.equal('Request')
        })
    })

    describe('render', function() {
        it('should render', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(Method, options)
            )
            expect(wrapper.find(Request).length).to.equal(1)
        })
    })
})
