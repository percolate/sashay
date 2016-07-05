var _ = require('lodash')
var Breadcrumb = require('./breadcrumb.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Breadcrumbs',

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        crumbs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
        onClick: React.PropTypes.func,
    },

    render: function () {
        return (
            <ul className="breadcrumbs">
                {_.map(this.props.crumbs, function (crumb, index) {
                    var isActive = index + 1 === this.props.crumbs.length
                    return (
                        <Breadcrumb
                            name={crumb}
                            isActive={isActive}
                            key={index}
                            onClick={this.onCrumbClick.bind(this, index)}
                        />
                    )
                }.bind(this))}
            </ul>
        )
    },

    onCrumbClick: function (index) {
        this.setState({
            crumbs: _.first(this.props.crumbs, index + 1),
        })
        if (this.props.onClick) {
            this.props.onClick(this.props.crumbs[index], index)
        }
    },
})
