var React = require('react')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var Tab = require('./tab.jsx')

module.exports = React.createClass({
    displayName: 'Tabs',

    mixins: [PureRenderMixin],

    propTypes: {
        tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
        activeTab: React.PropTypes.string,
        onClick: React.PropTypes.func,
    },

    render: function () {
        return (
            <div className="tabs">{this.renderTabs()}</div>
        )
    },

    renderTabs: function () {
        return this.props.tabs.map(function (tab, i) {
            return (
                <Tab
                    key={i}
                    name={tab}
                    isActive={tab === this.props.activeTab}
                    onClick={this.clickHandler.bind(this, tab)}
                />
            )
        }, this)
    },

    clickHandler: function (tab) {
        if (!this.props.onClick || this.props.activeTab === tab) return
        this.props.onClick(tab)
    },

})
