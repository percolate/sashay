var Code = require('./code.jsx')
var Dropdown = require('./dropdown-controller.jsx')
var fromJS = require('immutable').fromJS
var get = require('lodash/get')
var head = require('lodash/head')
var includes = require('lodash/includes')
var keys = require('lodash/keys')
var Map = require('immutable').Map
var noop = require('lodash/noop')
var PayloadController = require('./payload-controller.jsx')
var PropTypes = require('react').PropTypes
var React = require('react')

var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'Response',
    propTypes: {
        initialRoute: PropTypes.instanceOf(Map),
        method: PROP_TYPES.method,
        onChange: PropTypes.func,
        onResize: PropTypes.func,
    },

    componentWillMount: function () {
        if (!this.props.initialRoute) return
        if (!includes(keys(this.props.method.responses), this.props.initialRoute.get('parameterType'))) return
        this.setState({
            statusCode: this.props.initialRoute.get('parameterType'),
        })
    },

    getDefaultProps: function () {
        return {
            onChange: noop,
            onResize: noop,
        }
    },

    getInitialState: function () {
        return {
            statusCode: head(keys(this.props.method.responses)),
        }
    },

    onChangeStatus: function (statusCode) {
        this.setState({ statusCode: statusCode })
    },

    render: function () {
        var responseKeyPath = [
            'responses',
            this.state.statusCode,
            'body',
            'application/json',
        ]
        var { payload, example } = get(this.props.method, responseKeyPath) || {}
        return (
            <row>
                <content>
                    <section>
                        <h1>
                            {payload ? 'Body' : 'Empty body'}
                            {(this.state.statusCode) && (
                                <Dropdown
                                    className="push-left-medium"
                                    onChange={this.onChangeStatus}
                                    options={fromJS(keys(this.props.method.responses))}
                                    value={this.state.statusCode}
                                />
                            )}
                        </h1>
                        {(payload) && (
                            <PayloadController
                                initialRoute={this.props.initialRoute}
                                onChange={this.props.onChange}
                                onResize={this.props.onResize}
                                parentRoute={fromJS({
                                    parameterType: this.state.statusCode,
                                    slug: this.props.method.slug,
                                })}
                                schema={payload}
                            />
                        )}
                    </section>
                </content>
                <aside>
                    {(example) && (
                        <section>
                            <h1>Example response</h1>
                            <Code
                                code={example}
                                lang="json"
                                theme="dark"
                            />
                        </section>
                    )}
                </aside>
            </row>
        )
    },
})
