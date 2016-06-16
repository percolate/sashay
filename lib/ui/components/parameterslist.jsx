var Parameters = require('./parameters.jsx')
var React = require('react')

module.exports = React.createClass({

    render: function () {
        return <Parameters parameters={this.props.parameters}/>
    }
})
