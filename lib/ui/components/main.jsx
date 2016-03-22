var _ = require('lodash')
var helper = require('../../helper')
var marked = require('marked')
var Parameters = require('./parameters.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Main',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        baseUri: React.PropTypes.string.isRequired,
        title: React.PropTypes.string.isRequired,
        topics: React.PropTypes.array.isRequired,
        groups: React.PropTypes.array.isRequired,
        version: React.PropTypes.string.isRequired,
    },

    render: function () {
        return (
            <main ref="main">
                <section>
                    <article>
                        <h1>{this.props.title}</h1>
                    </article>
                    <aside />
                </section>
                {_.map(this.props.topics, function (topic) {
                    return (
                        <div key={topic.slug}>
                            <section
                                id={topic.slug}
                                ref={topic.slug}
                            >
                                <article>
                                    <h3>{topic.displayName}</h3>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: marked(topic.content),
                                        }}
                                    />
                                </article>
                                <aside />
                            </section>
                        </div>
                    )
                })}
                {_.map(this.props.groups, function (group) {
                    return (
                        <div key={group.displayName}>
                            <section
                                id={group.slug}
                                ref={group.slug}
                            >
                                <article>
                                    <h3>{group.displayName}</h3>
                                    {!_.isEmpty(group.description) && (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: marked(group.description),
                                            }}
                                        />
                                    )}
                                </article>
                                <aside />
                            </section>
                            {_.map(group.methods, function (method, i) {
                                var body = _.get(method, [
                                    'body',
                                    'application/json',
                                ])
                                var successResponse = helper.getSuccessResponseFromMethod(method)
                                var absoluteUri = this.props.baseUri + method.absoluteUri
                                return (
                                    <section
                                        id={method.slug}
                                        key={i}
                                        ref={method.slug}
                                    >
                                        <article>
                                            <h4>{method.displayName}</h4>
                                            {!_.isEmpty(method.description) && (
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: marked(method.description),
                                                    }}
                                                />
                                            )}
                                            {(!_.isEmpty(method.uriParameters)) && (
                                                <Parameters
                                                    displayName="URI Parameters"
                                                    parameters={method.uriParameters}
                                                />
                                            )}
                                            {(!_.isEmpty(method.queryParameters)) && (
                                                <Parameters
                                                    displayName="Query Parameters"
                                                    parameters={method.queryParameters}
                                                />
                                            )}
                                            {_.has(body, 'schema') && (
                                                <div>
                                                    <h6>Body</h6>
                                                    <pre>
                                                        <code>{_.get(body, 'schema')}</code>
                                                    </pre>
                                                </div>
                                            )}
                                        </article>
                                        <aside>
                                            {_.has(method, 'method') && (
                                                <div>
                                                    <h5>Definition</h5>
                                                    <pre>
                                                        <code>{[
                                                            method.method.toUpperCase(),
                                                            absoluteUri,
                                                        ].join(' ')}</code>
                                                    </pre>
                                                    {_.has(body, 'example') && (
                                                        <div>
                                                            <h5>Example request</h5>
                                                            <pre>
                                                                <code>{helper.getCurl(absoluteUri, method.method.toUpperCase(), 'YOUR_API_KEY', JSON.parse(_.get(body, 'example')))}</code>
                                                            </pre>
                                                        </div>
                                                    )}
                                                    {_.has(successResponse, 'example') && (
                                                        <div>
                                                            <h5>Example response</h5>
                                                            <pre>
                                                                <code>{_.get(successResponse, 'example')}</code>
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </aside>
                                    </section>
                                )
                            }, this)}
                        </div>
                    )
                }, this)}
            </main>
        )
    },

})
