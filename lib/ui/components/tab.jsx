var React = require('react')
var PureRenderMixin = require('react-addons-pure-render-mixin')

module.exports = React.createClass({
    displayName: 'Tab',

    mixins: [PureRenderMixin],

    propTypes: {
        name: React.PropTypes.string.isRequired,
        isActive: React.PropTypes.bool.isRequired,
        onClick: React.PropTypes.func,
    },

    render: function () {
        var className = this.props.isActive ? 'active' : 'inactive'

        return (
            <div className={`tab ${className}`} onClick={this.handleClick}>
                <div className="tab-label-wrapper">
                    <span className="tab-label">{this.props.name}</span>
                </div>
            </div>
        )
    },

    handleClick: function () {
        if (this.props.onClick) this.props.onClick()
    },
})
