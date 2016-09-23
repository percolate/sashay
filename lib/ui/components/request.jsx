var Code = require('./code.jsx')
var Curl = require('./curl.jsx')
var fromJS = require('immutable').fromJS
var get = require('lodash/get')
var Map = require('immutable').Map
var noop = require('lodash/noop')
var Parameters = require('./parameters.jsx')
var PayloadController = require('./payload-controller.jsx')
var PropTypes = require('react').PropTypes
var React = require('react')

var REQUEST_PARAMETER_TYPES = require('../constants').requestParameterTypes
var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'Request',
    propTypes: {
        initialRoute: PropTypes.instanceOf(Map),
        method: PROP_TYPES.method,
        onChange: PropTypes.func,
        onResize: PropTypes.func,
    },

    getDefaultProps: function () {
        return {
            onChange: noop,
            onResize: noop,
        }
    },

    render: function () {
        var { uriParameters, queryParameters } = this.props.method || {}
        var { payload, example } = get(this.props.method, ['body', 'application/json']) || {}
        var formParameters = get(this.props.method, ['body', 'application/x-www-form-urlencoded', 'formParameters'])
        return (
            <row>
                <content>
                    {(payload) && (
                        <section>
                            <h1>Body</h1>
                            <PayloadController
                                initialRoute={this.props.initialRoute}
                                onChange={this.props.onChange}
                                onResize={this.props.onResize}
                                parentRoute={fromJS({
                                    parameterType: REQUEST_PARAMETER_TYPES.payload.id,
                                    slug: this.props.method.slug,
                                })}
                                schema={payload}
                            />
                        </section>
                    )}
                    {(formParameters) && (
                        <section>
                            <h1>Form data</h1>
                            <Parameters
                                parameters={formParameters}
                                parentRoute={fromJS({
                                    parameterType: REQUEST_PARAMETER_TYPES.formPayload.id,
                                    slug: this.props.method.slug,
                                })}
                            />
                        </section>
                    )}
                    {(uriParameters) && (
                        <section>
                            <h1>URI Parameters</h1>
                            <Parameters
                                parameters={uriParameters}
                                parentRoute={fromJS({
                                    parameterType: REQUEST_PARAMETER_TYPES.params.id,
                                    slug: this.props.method.slug,
                                })}
                            />
                        </section>
                    )}
                    {(queryParameters) && (
                        <section>
                            <h1>Query Parameters</h1>
                            <Parameters
                                parameters={queryParameters}
                                parentRoute={fromJS({
                                    parameterType: REQUEST_PARAMETER_TYPES.query.id,
                                    slug: this.props.method.slug,
                                })}
                            />
                        </section>
                    )}
                </content>
                <aside>
                    {(example) && (
                        <section>
                            <h1>Example request body</h1>
                            <Code
                                code={example}
                                lang="json"
                                theme="dark"
                            />
                        </section>
                    )}
                    {(!formParameters) && (
                        <section>
                            <h1>Example curl request</h1>
                            <Curl
                                absoluteUri={this.props.method.absoluteUri}
                                method={this.props.method.method}
                                queryParameters={this.props.method.queryParameters}
                                securedBy={this.props.method.securedBy}
                            />
                        </section>
                    )}
                </aside>
            </row>
        )
    },
})
