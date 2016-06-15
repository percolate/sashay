var Parameters = require('./parameters.jsx')

module.exports = React.createClass({

    render: function () {
        return <Parameters parameters={this.props.parameters}/>
    }
})
