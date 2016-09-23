var Code = require('./code.jsx')
var fromJS = require('immutable').fromJS
var getSuccessResponseFromMethod = require('../helper').getSuccessResponseFromMethod
var Map = require('immutable').Map
var noop = require('lodash/noop')
var PayloadController = require('./payload-controller.jsx')
var PropTypes = require('react').PropTypes
var React = require('react')

var PARAMETER_TYPES = require('../constants').parameterTypes
var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'Response',
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
        var { payload, example } = getSuccessResponseFromMethod(this.props.method) || {}
        return (
            <row>
                <content>
                    <section>
                        <h1>{payload ? 'Body' : 'Empty body'}</h1>
                        {(payload) && (
                            <PayloadController
                                initialRoute={this.props.initialRoute}
                                onChange={this.props.onChange}
                                onResize={this.props.onResize}
                                parentRoute={fromJS({
                                    parameterType: PARAMETER_TYPES.response.id,
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
