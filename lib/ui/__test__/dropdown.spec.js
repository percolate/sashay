var createElement = require('react').createElement
var Dropdown = require('components/dropdown.jsx')
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS

describe('components/dropdown.jsx', function () {
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

    describe('onClickSwitch()', function () {
        it('should invoke onClickSwitch', function () {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(createElement(Dropdown, extend(options, {
                isOpen: true,
                onClickSwitch: spy,
            })))
            wrapper.find('.dropdown-switch').first().simulate('click')
            expect(spy).to.have.been.calledOnce
        })
    })

    describe('onClickOption()', function () {
        it('should invoke onClickOption', function () {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(createElement(Dropdown, extend(options, {
                isOpen: true,
                onClickOption: spy,
            })))
            wrapper.find('a').first().simulate('click')
            expect(spy).to.have.been.calledWith('b')
        })
    })

    describe('render()', function () {
        it('should render closed', function () {
            var wrapper = this.reactMounter.shallow(createElement(Dropdown, options))
            expect(wrapper.find('.dropdown-body').length).to.equal(0)
        })

        it('should render open', function () {
            var wrapper = this.reactMounter.shallow(createElement(Dropdown, extend(options, {
                isOpen: true,
            })))
            expect(wrapper.find('.dropdown-body').length).to.equal(1)
            expect(wrapper.find('span').text()).to.equal('a')
        })
    })
})
