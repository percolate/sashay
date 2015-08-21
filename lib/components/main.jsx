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
        host: React.PropTypes.string,
        info: React.PropTypes.shape({
            title: React.PropTypes.string.isRequired,
        }).isRequired,
        methodGroups: React.PropTypes.array.isRequired,
        schemes: React.PropTypes.array,
    },

    getDefaultProps: function () {
        return {
            host: 'percolate.com',
            schemes: ['https'],
        }
    },

    render: function () {
        return (
            <main ref="main">
                <section>
                    <article>
                        <h1>{this.props.info.title}</h1>
                        <h2>Methods</h2>
                    </article>
                    <aside />
                </section>
                {_.map(this.props.methodGroups, function (methodGroup) {
                    return (
                        <div key={methodGroup.slug}>
                            <section
                                id={methodGroup.slug}
                                ref={methodGroup.slug}
                            >
                                <article>
                                    <h3>{methodGroup.name}</h3>
                                </article>
                                <aside />
                            </section>
                            {_.map(methodGroup.methods, function (method) {
                                return (
                                    <section
                                        id={method.slug}
                                        key={method.slug}
                                        ref={method.slug}
                                    >
                                        <article>
                                            <h4>{method.name}</h4>
                                            <div dangerouslySetInnerHTML={{
                                                __html: marked(method.description),
                                            }} />
                                            {(!_.isEmpty(method.parameters))
                                                ?
                                                    <Parameters parameters={method.parameters} />
                                                :
                                                    undefined
                                            }
                                        </article>
                                        <aside>
                                            <h5>Definition</h5>
                                            <pre>
                                                <code>{[
                                                    method.verb.toUpperCase(),
                                                    url.format({
                                                        host: this.props.host,
                                                        pathname: method.pathname,
                                                        protocol: _.first(this.props.schemes),
                                                    }),
                                                ].join(' ')}</code>
                                            </pre>
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
