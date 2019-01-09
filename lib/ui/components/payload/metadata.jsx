var _ = require('lodash')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Metadata',

    mixins: [PureRenderMixin],

    propTypes: {
        metadata: React.PropTypes.objectOf(
            React.PropTypes.oneOfType([
                React.PropTypes.string,
                React.PropTypes.arrayOf(React.PropTypes.string),
            ])
        ).isRequired,
    },

    render: function() {
        if (_.isEmpty(this.props.metadata)) return null

        return (
            <ul className="metadata">
                {_.map(
                    this.props.metadata,
                    function(value, label) {
                        return (
                            <li key={label} className="metadata-item">
                                <div className="metadata-label">{label}:</div>
                                <div className="metadata-value">
                                    {this.renderValues(value)}
                                </div>
                            </li>
                        )
                    }.bind(this)
                )}
            </ul>
        )
    },

    renderValues: function(values) {
        if (_.isArray(values)) {
            return (
                <ul>
                    {_.map(
                        values,
                        function(value, index) {
                            return (
                                <li key={index}>{this.renderValue(value)}</li>
                            )
                        }.bind(this)
                    )}
                </ul>
            )
        } else {
            return this.renderValue(values)
        }
    },

    renderValue: function(value) {
        return <code className="inline">{value}</code>
    },
})
