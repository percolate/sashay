var _ = require('lodash')
var Code = require('./code.jsx')
var DeepLink = require('./deep-link.jsx')
var fromJS = require('immutable').fromJS
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var Map = require('immutable').Map
var Markdown = require('./markdown.jsx')
var Method = require('./method.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({

    displayName: 'Main',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        initialRoute: React.PropTypes.instanceOf(Map),
        topics: PROP_TYPES.topics.id,
        groups: React.PropTypes.array.isRequired,
        version: React.PropTypes.string.isRequired,
        onResize: React.PropTypes.func,
    },

    getDefaultProps: function () {
        return {
            onResize: _.noop,
        }
    },

    render: function () {
        return (
            <main ref="main">
                {_.map(this.props.topics, function (topic) {
                    var pathname = getPathnameFromRoute(fromJS({ slug: topic.slug }))
                    return (
                        <article
                            id={pathname}
                            ref={topic.slug}
                            key={topic.slug}
                        >
                            <row>
                                <content>
                                    <h2><DeepLink pathname={pathname} /> {topic.displayName}</h2>
                                </content>
                                <aside />
                            </row>
                            {_.map(topic.contents, this.renderContent)}
                        </article>
                    )
                }.bind(this))}
                {_.map(this.props.groups, this.renderGroup)}
            </main>
        )
    },

    renderContent: function (content, index) {
        var text
        var aside

        if (content.type === 'code') {
            aside = <Code lang={content.lang} code={content.text} theme="dark" />
        } else {
            text = <Markdown content={content.text} />
        }

        return (
            <row key={'topic-content-' + index}>
                <content>{text}</content>
                <aside>{aside}</aside>
            </row>
        )
    },

    renderGroup: function (group) {
        var pathname = getPathnameFromRoute(fromJS({ slug: group.slug }))
        return (
            <article
                id={pathname}
                key={group.displayName}
                ref={group.slug}
            >
                <row>
                    <content>
                        <h2><DeepLink pathname={pathname} /> {group.displayName}</h2>
                        {!_.isEmpty(group.description) && (
                            <Markdown content={group.description} />
                        )}
                    </content>
                    <aside />
                </row>
                {_.chain(group.methods).map(this.renderMethod).flatten().value()}
            </article>
        )
    },

    renderMethod: function (method, i) {
        return (
            <div key={i} ref={method.slug}>
                <Method
                    method={method}
                    initialRoute={this.props.initialRoute}
                    onResize={this.props.onResize}
                />
            </div>
        )
    },

})
