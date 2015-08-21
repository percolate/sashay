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
        methodGroups: React.PropTypes.array.isRequired,
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
                    {_.map(this.props.methodGroups, function (methodGroup) {
                        var isSelected = (methodGroup.slug === this.props.hash)
                        var isExpanded = isSelected || !!_.findWhere(methodGroup.methods, { slug: this.props.hash })
                        return (
                            <li key={methodGroup.slug}>
                                <a
                                    className={isSelected ? 'selected' : undefined}
                                    href={'#' + methodGroup.slug}
                                    ref={methodGroup.slug}
                                >{methodGroup.name}</a>
                                <ul className={!isExpanded && 'hide'}>
                                    {_.map(methodGroup.methods, function (method) {
                                        return (
                                            <li key={method.slug}>
                                                <a
                                                    className={(method.slug === this.props.hash) ? 'selected' : undefined}
                                                    href={'#' + method.slug}
                                                    ref={method.slug}
                                                >{method.name}</a>
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
