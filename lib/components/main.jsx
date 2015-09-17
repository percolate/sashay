var _ = require('lodash')
var marked = require('marked')
var Parameters = require('./parameters.jsx')
var PureRenderMixin = require('react/addons').addons.PureRenderMixin
var React = require('react')
var url = require('url')

module.exports = React.createClass({

    displayName: 'Main',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        basePath: React.PropTypes.string,
        host: React.PropTypes.string,
        info: React.PropTypes.shape({
            title: React.PropTypes.string.isRequired,
        }).isRequired,
        groups: React.PropTypes.array.isRequired,
        schemes: React.PropTypes.array,
    },

    render: function () {
        return (
            <main ref="main">
                <section>
                    <article>
                        <h1>{this.props.info.title}</h1>
                    </article>
                    <aside />
                </section>
                {_.map(this.props.groups, function (group) {
                    return (
                        <div key={group.name}>
                            <section
                                id={group.name}
                                ref={group.name}
                            >
                                <article>
                                    <h3>{group.description}</h3>
                                </article>
                                <aside />
                            </section>
                            {_.map(group.operations, function (operation) {
                                return (
                                    <div
                                        id={operation.slug}
                                        key={operation.slug}
                                        ref={operation.slug}
                                    >
                                        <section>
                                            <article>
                                                <h4>{operation.summary}</h4>
                                                {!_.isEmpty(operation.description) && (
                                                    <div dangerouslySetInnerHTML={{
                                                        __html: marked(operation.description),
                                                    }} />
                                                )}
                                                {(!_.isEmpty(operation.parameters)) && (
                                                    <Parameters parameters={operation.parameters} />
                                                )}
                                                {!_.isEmpty(operation.response) && (
                                                    <div>
                                                        <h4>Returns</h4>
                                                        <div dangerouslySetInnerHTML={{
                                                            __html: marked(operation.response.description),
                                                        }} />
                                                    </div>
                                                )}
                                            </article>
                                            <aside>
                                                <h5>Definition</h5>
                                                <pre>
                                                    <code>{[
                                                        operation.verb.toUpperCase(),
                                                        url.format({
                                                            host: this.props.host,
                                                            pathname: [this.props.basePath, operation.path].join(''),
                                                            protocol: _.first(this.props.schemes),
                                                        }),
                                                    ].join(' ')}</code>
                                                </pre>
                                                {!_.isEmpty(operation.response) && (
                                                    <div>
                                                        <h5>Example response</h5>
                                                        <pre>
                                                            <code>{JSON.stringify(operation.response.example, undefined, 2)}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </aside>
                                        </section>
                                    </div>
                                )
                            }, this)}
                        </div>
                    )
                }, this)}
            </main>
        )
    },

})
