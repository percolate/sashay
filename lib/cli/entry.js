var ControlledApp = require('../ui/components/controlled-app.jsx')
var React = require('react')
var ReactDom = require('react-dom')

module.exports = function (data, htmlElement) {
    var el = React.createElement(ControlledApp, data)
    ReactDom.render(el, htmlElement)
}
