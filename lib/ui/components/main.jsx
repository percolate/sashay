var _ = require('lodash')
var Code = require('./code.jsx')
var helper = require('../../helper')
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactTabs = require('react-tabs');
var Tab = ReactTabs.Tab;
var Tabs = ReactTabs.Tabs;
var TabList = ReactTabs.TabList;
var TabPanel = ReactTabs.TabPanel;

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
        var body = _.get(method, [
            'body',
            'application/json',
        ])
        var successResponse = helper.getSuccessResponseFromMethod(method)
        var absoluteUri = this.props.baseUri + method.absoluteUri
        var exampleAbsoluteUri = helper.addRequiredQueryParameters(this.props.baseUri, method)

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
                    {(!_.isEmpty(method.uriParameters)) && (
                        <section>
                            <h1>URI Parameters</h1>
                            <Parameters parameters={method.uriParameters} />
                        </section>
                    )}
                    {(!_.isEmpty(method.queryParameters)) && (
                        <section>
                            <h1>Query Parameters</h1>
                            <Parameters parameters={method.queryParameters} />
                        </section>
                    )}
                    {_.has(body, 'properties') && _.has(body, 'schema') && (
                        <section>
                            <h1>Body</h1>
                                <Tabs>
                                    <TabList>
                                        <Tab>Properties</Tab>
                                        <Tab>Schema</Tab>
                                    </TabList>
                                    <TabPanel>
                                        <Parameters parameters={_.get(body, 'properties')} />
                                    </TabPanel>
                                    <TabPanel>
                                        <Code lang="json" code={_.get(body, 'schema')}/>
                                    </TabPanel>
                                </Tabs>
                        </section>
                    )}
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

                    {_.has(body, 'example') && (
                        <section>
                            <h1>Example request body</h1>
                            <Code lang="json" code={_.get(body, 'example')} />
                        </section>
                    )}

                    {_.has(method, 'method') && (
                        <section>
                            <h1>Example curl request</h1>
                                <Code lang="sh" code={helper.getCurl(exampleAbsoluteUri, method.method.toUpperCase(), 'YOUR_API_KEY')} />
                        </section>
                    )}

                    {_.has(successResponse, 'example') && (
                        <section>
                            <h1>Example response</h1>
                            <Code lang="json" code={_.get(successResponse, 'example')} />
                        </section>
                    )}
                </aside>
            </row>
        )
    },

})
