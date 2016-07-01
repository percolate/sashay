var _ = require('lodash')
var Code = require('./code.jsx')
var Example = require('./example.jsx')
var helper = require('../../helper')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var Tabs = require('./tabs.jsx')

var REQUEST = 'Request'
var RESPONSE = 'Response'

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

    getInitialState: function () {
        return {}
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

    showExample: function (tab, key, index) {
        var tabName = tab[index - 1]
        if (tabName) {
            var show
            if (tabName === REQUEST) {
                show = true
            } else if (tabName === RESPONSE) {
                show = false
            } else {
                show = undefined
            }
            this.setState({
                [key]: show,
            })
        }
    },

    showExampleRequest: function (method) {
        if (!_.isEmpty(method.queryParameters) || !_.isEmpty(method.uriParameters)) {
            return undefined
        }
        var body = _.get(method, [
            'body',
            'application/json',
        ])
        if (!_.isEmpty(_.get(body, 'payload'))) {
            return true
        }
        var successResponse = helper.getSuccessResponseFromMethod(method)
        if (!_.isEmpty(_.get(successResponse, 'payload'))) {
            return false
        }
        return undefined
    },

    renderMethod: function (method, i) {
        var body = _.get(method, [
            'body',
            'application/json',
        ])
        var successResponse = helper.getSuccessResponseFromMethod(method)
        var absoluteUri = this.props.baseUri + method.absoluteUri
        var exampleAbsoluteUri = helper.addRequiredQueryParameters(this.props.baseUri, method)
        var uniqueKey = method.absoluteUri + '-' + method.method
        var showExampleRequest = _.has(this.state, uniqueKey) ? this.state[uniqueKey] : this.showExampleRequest(method)

        return (
            <row
                id={method.slug}
                key={i}
                ref={method.slug}
            >
                <content>
                    <h3>{method.displayName}</h3>
                    {!_.isEmpty(method.description) && (
                        <section>
                            <Markdown content={method.description} />
                        </section>
                    )}
                    <Tabs method={method} onSelect={this.showExample}/>
                </content>
                <aside>
                    {_.has(method, 'method') && (
                        <section>
                            <h1>Definition</h1>
                            <Code lang="http" code={[
                                method.method.toUpperCase(),
                                absoluteUri,
                            ].join(' ')}
                            />
                        </section>
                    )}

                    {method.absoluteUri && <Example showExampleRequest={this.state[uniqueKey] || showExampleRequest} method={method} baseUri={this.props.baseUri} onChange={this.props.onChange}/>}
                </aside>
            </row>
        )
    },

})
