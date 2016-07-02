var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Breadcrumb',

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        name: React.PropTypes.string.isRequired,
        isActive: React.PropTypes.bool,
        onClick: React.PropTypes.func,
    },

    render: function () {
        return (
            <li className={this.props.isActive ? 'active' : ''}>
                <a href="#" onClick={this.onClick}>{this.props.name}</a>
            </li>
        )
    },

    onClick: function (e) {
        e.preventDefault()
        if (this.props.onClick) this.props.onClick()
    },
})