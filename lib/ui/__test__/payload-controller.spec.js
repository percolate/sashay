var createElement = require('react').createElement
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Payload = require('components/payload.jsx')
var PayloadController = require('components/payload-controller.jsx')

describe('components/payload-controller.jsx', function() {
    var options

    beforeEach(function() {
        options = {
            initialRoute: fromJS({}),
            parentRoute: fromJS({}),
            schema: {},
        }
    })

    describe('componentWillMount()', function() {
        it('should noop if the parameter path is not present', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(PayloadController, options)
            )
            expect(wrapper.state('keyPath').toJS()).to.deep.equal(['root'])
        })

        it('should set the keyPath', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    PayloadController,
                    extend(options, {
                        initialRoute: fromJS({
                            parameterPath: 'a.b.c',
                        }),
                    })
                )
            )
            expect(wrapper.state('keyPath').toJS()).to.deep.equal([
                'root',
                'a',
                'b',
            ])
        })
    })

    describe('componentWillReceiveProps()', function() {
        it('should reset state on parent re-render', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(
                    PayloadController,
                    extend(options, {
                        initialRoute: fromJS({
                            parameterPath: 'a.b.c',
                        }),
                    })
                )
            )
            wrapper.setProps(options)
            expect(wrapper.state('keyPath').toJS()).to.deep.equal(['root'])
            expect(wrapper.state('propertyTypeModifiers').toJS()).to.deep.equal(
                {}
            )
        })
    })

    describe('onClickBreadcrumb()', function() {
        it('should set the keyPath and invoke onChange', function() {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(
                createElement(
                    PayloadController,
                    extend(options, {
                        onChange: spy,
                    })
                )
            )
            wrapper.find(Payload).prop('onBreadCrumbsClick')(['a', 'b'])
            expect(wrapper.state('keyPath').toJS()).to.deep.equal([
                'root',
                'a',
                'b',
            ])
            expect(spy).to.have.callCount(1)
        })
    })

    describe('onClickPath()', function() {
        it('should set the keyPath and invoke onChange', function() {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(
                createElement(
                    PayloadController,
                    extend(options, {
                        onChange: spy,
                    })
                )
            )
            wrapper.find(Payload).prop('onViewPropsClick')(['root', 'a', 'b'])
            expect(wrapper.state('keyPath').toJS()).to.deep.equal([
                'root',
                'a',
                'b',
            ])
            expect(spy).to.have.callCount(1)
        })
    })

    describe('onClickSubtype()', function() {
        it('should set the propertyTypeModifiers', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(PayloadController, options)
            )
            wrapper.find(Payload).prop('onSubTypeClick')('a', 123)
            expect(wrapper.state('propertyTypeModifiers').toJS()).to.deep.equal(
                {
                    a: { subType: 123 },
                }
            )
        })
    })

    describe('onClickType()', function() {
        it('should set the propertyTypeModifiers', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(PayloadController, options)
            )
            wrapper.find(Payload).prop('onTypeClick')('a', 'b')
            expect(wrapper.state('propertyTypeModifiers').toJS()).to.deep.equal(
                {
                    a: { type: 'b' },
                }
            )
        })
    })

    describe('render', function() {
        it('should render', function() {
            this.reactMounter.shallow(createElement(PayloadController, options))
        })
    })
})
