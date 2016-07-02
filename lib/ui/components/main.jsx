var _ = require('lodash')
var Code = require('./code.jsx')
var Markdown = require('./markdown.jsx')
var Method = require('./method.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Main',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        baseUri: React.PropTypes.string.isRequired,
        topics: React.PropTypes.arrayOf(
            React.PropTypes.shape({
                displayName: React.PropTypes.string.isRequired,
                contents: React.PropTypes.arrayOf(
                    React.PropTypes.shape({
                        lang: React.PropTypes.string,
                        text: React.PropTypes.string.isRequired,
                        type: React.PropTypes.oneOf(['text', 'code']).isRequired,
                    })
                ),
                slug: React.PropTypes.string.isRequired,
            })
        ).isRequired,
        groups: React.PropTypes.array.isRequired,
        version: React.PropTypes.string.isRequired,
    },

    render: function () {
        return (
            <main ref="main">
                {_.map(this.props.topics, function (topic) {
                    return (
                        <article
                            id={topic.slug}
                            ref={topic.slug}
                            key={topic.slug}
                        >
                            <row>
                                <content>
                                    <h2>{topic.displayName}</h2>
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
            aside = <Code lang={content.lang} code={content.text} />
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
        return (
            <article
                id={group.slug}
                key={group.displayName}
                ref={group.slug}
            >
                <row>
                    <content>
                        <h2>{group.displayName}</h2>
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
        return <Method method={method} baseUri={this.props.baseUri} key={i} />
    },

})
