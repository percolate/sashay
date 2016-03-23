var _ = require('lodash')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Nav',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        hash: React.PropTypes.string,
        groups: React.PropTypes.array.isRequired,
        topics: React.PropTypes.array.isRequired,
    },

    render: function () {
        return (
            <nav>
                {!_.isEmpty(this.props.topics) && (
                    <div>
                        <h2>Topics</h2>
                        <ul>
                            {_.map(this.props.topics, this.renderTopic)}
                        </ul>
                    </div>
                )}
                <h2>Methods</h2>
                <ul>
                    {_.map(this.props.groups, this.renderGroup)}
                </ul>
            </nav>
        )
    },

    renderTopic: function (topic) {
        var isSelected = (topic.slug === this.props.hash)
        return (
            <li key={topic.slug}>
                <a
                    className={isSelected ? 'selected' : undefined}
                    href={'#' + topic.slug}
                    ref={topic.slug}
                >{topic.displayName}</a>
            </li>
        )
    },

    renderGroup: function (group) {
        var isSelected = (group.slug === this.props.hash)
        var isExpanded = isSelected || !!_.find(group.methods, { slug: this.props.hash })
        return (
            <li key={group.displayName}>
                <a
                    className={isSelected ? 'selected' : undefined}
                    href={'#' + group.slug}
                    ref={group.slug}
                >{group.displayName}</a>
                <ul className={!isExpanded && 'hide'}>
                    {_.map(group.methods, this.renderGroupMethod)}
                </ul>
            </li>
        )
    },

    renderGroupMethod: function (method, i) {
        return (
            <li key={i}>
                <a
                    className={(method.slug === this.props.hash) ? 'selected' : undefined}
                    href={'#' + method.slug}
                    ref={method.slug}
                >{method.displayName}</a>
            </li>
        )
    },

})
