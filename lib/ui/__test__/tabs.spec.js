var createElement = require('react').createElement
var expect = require('chai').expect
var extend = require('lodash/extend')
var Tabs = require('components/tabs.jsx')

describe('components/tabs.jsx', function() {
    var options

    beforeEach(function() {
        options = {
            activeTab: 'b',
            tabs: ['a', 'b'],
        }
    })

    describe('onClick()', function() {
        it('should noop if active', function() {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Tabs,
                    extend(options, {
                        onChange: spy,
                    })
                )
            )
            wrapper.find('.active').simulate('click')
            expect(spy).to.have.not.been.calledOnce
        })

        it('should invoke onChange', function() {
            var spy = this.sandbox.spy()
            var wrapper = this.reactMounter.shallow(
                createElement(
                    Tabs,
                    extend(options, {
                        onChange: spy,
                    })
                )
            )
            wrapper
                .find('.tab')
                .first()
                .simulate('click')
            expect(spy).to.have.been.calledWith('a')
        })
    })

    describe('render', function() {
        it('should render', function() {
            var wrapper = this.reactMounter.shallow(
                createElement(Tabs, options)
            )
            expect(wrapper.find('.tab').length).to.equal(2)
            expect(wrapper.find('.active').text()).to.equal('b')
        })
    })
})
