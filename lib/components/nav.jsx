var _ = require('lodash')
var PureRenderMixin = require('react/addons').addons.PureRenderMixin
var React = require('react')

module.exports = React.createClass({

    displayName: 'Nav',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        hash: React.PropTypes.string,
        groups: React.PropTypes.array.isRequired,
    },

    render: function () {
        return (
            <nav>
                <h2>Versions</h2>
                <ul>
                    <li><a href="/v5/">v5</a></li>
                    <li><a href="/v4/">v4</a></li>
                    <li><a href="/v3/">v3</a></li>
                </ul>
                <h2>Methods</h2>
                <ul>
                    {_.map(this.props.groups, function (group) {
                        var isSelected = (group.name === this.props.hash)
                        var isExpanded = isSelected || !!_.findWhere(group.operations, { slug: this.props.hash })
                        return (
                            <li key={group.name}>
                                <a
                                    className={isSelected ? 'selected' : undefined}
                                    href={'#' + group.name}
                                    ref={group.name}
                                >{group.description}</a>
                                <ul className={!isExpanded && 'hide'}>
                                    {_.map(group.operations, function (operation, i) {
                                        return (
                                            <li key={i}>
                                                <a
                                                    className={(operation.slug === this.props.hash) ? 'selected' : undefined}
                                                    href={'#' + operation.slug}
                                                    ref={operation.slug}
                                                >{operation.summary}</a>
                                            </li>
                                        )
                                    }, this)}
                                </ul>
                            </li>
                        )
                    }, this)}
                </ul>
            </nav>
        )
    },

})
