var _ = require('lodash')
var fromJS = require('immutable').fromJS
var getHashFromRoute = require('../helper').getHashFromRoute
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Nav',
    mixins: [PureRenderMixin],
    propTypes: {
        currentSlug: React.PropTypes.string,
        groups: React.PropTypes.array.isRequired,
        logo: React.PropTypes.string,
        topics: React.PropTypes.array.isRequired,
    },

    render: function() {
        return (
            <nav>
                {this.props.logo && (
                    <div className="logo">
                        <img src={this.props.logo} alt="Percolate" />
                    </div>
                )}

                {!_.isEmpty(this.props.topics) && (
                    <section>
                        <h2>Topics</h2>
                        <ul>{_.map(this.props.topics, this.renderTopic)}</ul>
                    </section>
                )}
                <section>
                    <h2>Methods</h2>
                    <ul>{_.map(this.props.groups, this.renderGroup)}</ul>
                </section>
            </nav>
        )
    },

    renderTopic: function(topic) {
        var isSelected = topic.slug === this.props.currentSlug
        return (
            <li key={topic.slug}>
                <a
                    className={isSelected ? 'selected' : undefined}
                    href={getHashFromRoute(fromJS({ slug: topic.slug }))}
                    ref={topic.slug}
                >
                    {topic.displayName}
                </a>
            </li>
        )
    },

    renderGroup: function(group) {
        var isSelected = group.slug === this.props.currentSlug
        var isExpanded =
            isSelected ||
            !!_.find(group.methods, { slug: this.props.currentSlug })
        return (
            <li key={group.displayName}>
                <a
                    className={isSelected ? 'selected' : undefined}
                    href={getHashFromRoute(fromJS({ slug: group.slug }))}
                    ref={group.slug}
                >
                    {group.displayName}
                </a>
                <ul className={!isExpanded && 'hide'}>
                    {_.map(group.methods, this.renderGroupMethod)}
                </ul>
            </li>
        )
    },

    renderGroupMethod: function(method, i) {
        return (
            <li key={i}>
                <a
                    className={
                        method.slug === this.props.currentSlug
                            ? 'selected'
                            : undefined
                    }
                    href={getHashFromRoute(fromJS({ slug: method.slug }))}
                    ref={method.slug}
                >
                    {method.displayName}
                </a>
            </li>
        )
    },
})
