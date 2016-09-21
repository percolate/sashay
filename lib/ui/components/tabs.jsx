var classNames = require('classnames')
var noop = require('lodash/noop')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Tabs',
    mixins: [PureRenderMixin],
    propTypes: {
        activeTab: React.PropTypes.string.isRequired,
        tabs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
        onClick: React.PropTypes.func,
    },

    getDefaultProps: function () {
        return {
            onClick: noop,
        }
    },

    onClick: function (tab) {
        if (this.props.activeTab === tab) return
        this.props.onClick(tab)
    },

    render: function () {
        return (
            <div className="tabs">
                {this.props.tabs.map(function (tab) {
                    return (
                        <div
                            className={classNames('tab', {
                                active: (tab === this.props.activeTab),
                            })}
                            key={tab}
                            onClick={this.onClick.bind(this, tab)}
                        >
                            <div className="tab-label-wrapper">
                                <span className="tab-label">{tab}</span>
                            </div>
                        </div>
                    )
                }.bind(this))}
            </div>
        )
    },
})
