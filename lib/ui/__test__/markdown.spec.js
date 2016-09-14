var createElement = require('react').createElement
var expect = require('chai').expect
var Markdown = require('components/markdown.jsx')
var render = require('enzyme/render')

describe('components/markdown.jsx', function () {
    it('should open external links in a new window', function () {
        var wrapper = render(createElement(Markdown, {
            content: '[hello](http://example.com)',
        }))
        expect(wrapper.find('a[target="_blank"]')).to.have.length(1)
        expect(wrapper.find('a[href="http://example.com"]')).to.have.length(1)
    })

    it('should open mailto links in the same window', function () {
        var wrapper = render(createElement(Markdown, {
            content: '[hello](mailto:example@percolate.com)',
        }))
        expect(wrapper.find('a[target="_self"]')).to.have.length(1)
        expect(wrapper.find('a[href="mailto:example@percolate.com"]')).to.have.length(1)
    })

    it('should open anchor links in the same window', function () {
        var wrapper = render(createElement(Markdown, {
            content: '[hello](#/path.to.something)',
        }))
        expect(wrapper.find('a[target="_self"]')).to.have.length(1)
        expect(wrapper.find('a[href="#/path.to.something"]')).to.have.length(1)
    })
})
