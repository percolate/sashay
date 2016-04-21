var _ = require('lodash')
var IS_BROWSER = require('../../env').IS_BROWSER
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

// url loader doesn't work for server rendering
var logo = IS_BROWSER && require('../img/api-logo-white.png')

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
                {logo && (
                    <div className="logo">
                        <img src={logo} alt="Percolate" />
                    </div>
                )}

                {!_.isEmpty(this.props.topics) && (
                    <section>
                        <h2>Topics</h2>
                        <ul>
                            {_.map(this.props.topics, this.renderTopic)}
                        </ul>
                    </section>
                )}
                <section>
                    <h2>Methods</h2>
                    <ul>
                        {_.map(this.props.groups, this.renderGroup)}
                    </ul>
                </section>
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
