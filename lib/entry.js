var React = require('react')
var Controller = require('./components/controller.jsx')

module.exports = function (data) {
    var el = React.createElement(Controller, data)
    React.render(el, document.getElementById('root'))
}
