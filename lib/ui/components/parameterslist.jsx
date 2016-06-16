var Parameters = require('./parameters.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Parameters List',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        parameters: React.PropTypes.shape({
            default: React.PropTypes.string,
            displayName: React.PropTypes.string,
            enum: React.PropTypes.array,
            pattern: React.PropTypes.string,
            required: React.PropTypes.bool,
            type: React.PropTypes.any,
        }),
    },

    render: function () {
        return <Parameters parameters={this.props.parameters}/>
    },
})
