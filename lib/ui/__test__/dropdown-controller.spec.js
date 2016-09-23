var createElement = require('react').createElement
var Dropdown = require('components/dropdown.jsx')
var DropdownController = require('components/dropdown-controller.jsx')
var findRenderedDOMComponentWithClass = require('react-addons-test-utils').findRenderedDOMComponentWithClass
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Simulate = require('react-addons-test-utils').Simulate

describe('components/dropdown-controller.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            options: fromJS([
                'a',
                'b',
                'c',
            ]),
            value: 'a',
        }
    })

    describe('onClickDocument()', function () {
        it('should noop if closed', function () {
            var component = this.reactMounter.renderIntoDocument(createElement(DropdownController, options))
            component.onClickDocument()
        })

        it('should noop if target is in component', function () {
            var component = this.reactMounter.renderIntoDocument(createElement(DropdownController, options))
            component.onClickDocument()
            Simulate.click(findRenderedDOMComponentWithClass(component, 'dropdown-switch'))
            expect(component.state.isOpen).to.equal(true)
            component.onClickDocument({ target: findRenderedDOMComponentWithClass(component, 'dropdown-body') })
            expect(component.state.isOpen).to.equal(true)
        })

        it('should close', function () {
            var component = this.reactMounter.renderIntoDocument(createElement(DropdownController, options))
            component.onClickDocument()
            Simulate.click(findRenderedDOMComponentWithClass(component, 'dropdown-switch'))
            expect(component.state.isOpen).to.equal(true)
            component.onClickDocument({})
            expect(component.state.isOpen).to.equal(false)
        })
    })

    describe('onClickOption()', function () {
        it('should callback and close', function () {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(createElement(DropdownController, extend(options, {
                onChange: spy,
            })))
            wrapper.find(Dropdown).prop('onClickSwitch')()
            wrapper.find(Dropdown).prop('onClickOption')('foo')
            expect(wrapper.state('isOpen')).to.equal(false)
            expect(spy).to.have.been.calledWith('foo')
        })
    })

    describe('onClickSwitch()', function () {
        it('should toggle isOpen', function () {
            var wrapper = this.reactMounter.shallow(createElement(DropdownController, options))
            wrapper.find(Dropdown).prop('onClickSwitch')()
            expect(wrapper.state('isOpen')).to.equal(true)
        })
    })

    describe('render()', function () {
        it('should render', function () {
            this.reactMounter.shallow(createElement(DropdownController, options))
        })
    })
})
