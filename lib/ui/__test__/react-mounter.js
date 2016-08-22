var enzyme = require('enzyme')
var extend = require('lodash/extend')
var findDOMNode = require('react-dom').findDOMNode
var isFunction = require('lodash/isFunction')
var renderIntoDocument = require('react-addons-test-utils').renderIntoDocument
var unmountComponentAtNode = require('react-dom').unmountComponentAtNode

module.exports = ReactMounter

function ReactMounter () {
    this.nodes = []
}

extend(ReactMounter.prototype, {

    mount: function () {
        var wrapper = enzyme.mount.apply(enzyme, arguments)
        this.nodes.push(wrapper)
        return wrapper
    },

    renderIntoDocument: function () {
        var component = renderIntoDocument.apply(undefined, arguments)
        this.nodes.push(component)
        return component
    },

    shallow: function () {
        var wrapper = enzyme.shallow.apply(enzyme, arguments)
        this.nodes.push(wrapper)
        return wrapper
    },

    unmountAll: function () {
        this.nodes.forEach(function (node) {
            if (isFunction(node.unmount)) {
                node.unmount()
                return
            }
            var htmlElement = findDOMNode(node)
            if (htmlElement) unmountComponentAtNode(htmlElement.parentNode)
        })
    },

})
