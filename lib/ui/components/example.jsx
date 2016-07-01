var _ = require('lodash')
var Code = require('./code.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var helper = require('../../helper')

module.exports = React.createClass({

    displayName: 'Code example',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        method: React.PropTypes.object.isRequired,
        baseUri: React.PropTypes.string.isRequired,
        showExampleRequest: React.PropTypes.bool,
    },

    getInitialState: function () {
        return {}
    },

    render: function () {
        var method = this.props.method
        var body = _.get(method, [
            'body',
            'application/json',
        ])
        var successResponse = helper.getSuccessResponseFromMethod(method)
        var exampleAbsoluteUri = helper.addRequiredQueryParameters(this.props.baseUri, method)

        if (this.props.showExampleRequest) {
            return (<div>
                {_.has(body, 'example') && (
                    <section>
                        <h1>Example request body</h1>
                        <Code lang="json" code={_.get(body, 'example')} />
                    </section>
                )}

                {_.has(method, 'method') && (
                    <section>
                        <h1>Example curl request</h1>
                            <Code lang="sh" code={helper.getCurl(exampleAbsoluteUri, method.method.toUpperCase(), '{your_api_key}')} />
                    </section>
                )}
            </div>)
        } else if (this.props.showExampleRequest === false) {
            return (<div>{_.has(successResponse, 'example') && (
                <section>
                    <h1>Example response</h1>
                    <Code lang="json" code={_.get(successResponse, 'example')} />
                </section>
            )}</div>)
        } else {
            return null
        }
    },

})
