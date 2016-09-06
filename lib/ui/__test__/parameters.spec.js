var createElement = require('react').createElement
var DeepLink = require('components/deep-link.jsx')
var expect = require('chai').expect
var extend = require('lodash/extend')
var fromJS = require('immutable').fromJS
var Parameters = require('components/parameters.jsx')

describe('components/parameters.jsx', function () {
    var options

    beforeEach(function () {
        options = {
            parameters: {},
            parentRoute: fromJS({}),
        }
    })

    describe('render()', function () {
        it('should render the deep link', function () {
            var wrapper = this.reactMounter.shallow(createElement(Parameters, extend(options, {
                parameters: {
                    foo: {
                        displayName: 'foo',
                        type: 'string',
                    },
                },
                parentRoute: fromJS({
                    parameterType: 'query',
                    slug: 'a',
                }),
            })))
            expect(wrapper.find(DeepLink).first().prop('pathname')).to.equal('/a/query/foo')
        })
    })
})
