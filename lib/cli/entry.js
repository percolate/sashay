var React = require('react')
var ReactDom = require('react-dom')
var Controller = require('../ui/components/controller.jsx')

module.exports = function (data) {
    var el = React.createElement(Controller, data)
    ReactDom.render(el, document.getElementById('root'))
}
