var _ = require('lodash')
var Code = require('./code.jsx')
var React = require('react')
var helper = require('../../helper')
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var Payload = require('./payload.jsx')
var Tabs = require('./tabs.jsx')

var TABS = ['Request', 'Response']

module.exports = React.createClass({
    displayName: 'Method',

    propTypes: {
        method: React.PropTypes.shape({
            description: React.PropTypes.string,
            displayName: React.PropTypes.string.isRequired,
            slug: React.PropTypes.string.isRequired,
            method: React.PropTypes.string,
        }).isRequired,
        baseUri: React.PropTypes.string.isRequired,
    },

    getInitialState: function () {
        return {
            activeTab: _.first(TABS),
        }
    },

    render: function () {
        var { method } = this.props

        return (
            <div className="method">
                <row id={method.slug} ref={method.slug} className="endpoint">
                    <content>
                        <h3>{method.displayName}</h3>
                        {this.renderMethod()}
                        {this.renderDescription()}
                    </content>
                    <aside />
                </row>
                <row className="tabs-section">
                    <content>
                        <Tabs
                            tabs={TABS}
                            activeTab={this.state.activeTab}
                            onClick={this.tabClickHandler}
                        />
                    </content>
                    <aside>
                        <Tabs
                            tabs={[' ']}
                        />
                    </aside>
                </row>
                {this.renderActiveContent()}
            </div>
        )
    },

    renderMethod: function () {
        var { baseUri, method } = this.props
        var absoluteUri = baseUri + method.absoluteUri
        if (!method.method) return null
        return (
            <section>
                <Code lang="http" code={`${method.method.toUpperCase()} ${absoluteUri}`} />
            </section>
        )
    },

    renderDescription: function () {
        var description = _.get(this.props, ['method', 'description'])
        if (!description) return null
        return (
            <section>
                <Markdown content={description} />
            </section>
        )
    },

    renderActiveContent: function () {
        switch (this.state.activeTab) {
            case 'Request':
                return this.renderRequest()
            case 'Response':
                return this.renderResponse()
            default:
                throw new Error(`Unsupported tab: ${this.state.activeTab}`)
        }
    },

    renderRequest: function () {
        var { method } = this.props
        var body = _.get(method, ['body', 'application/json'])
        var exampleAbsoluteUri = helper.addRequiredQueryParameters(this.props.baseUri, method)
        var action = method.method ? method.method.toUpperCase() : 'Definition'
        return (
            <row>
                <content>
                    {(method.uriParameters) && (
                        <section>
                            <h1>URI Parameters</h1>
                            <Parameters parameters={method.uriParameters} />
                        </section>
                    )}
                    {(method.queryParameters) && (
                        <section>
                            <h1>Query Parameters</h1>
                            <Parameters parameters={method.queryParameters} />
                        </section>
                    )}
                    {(body && body.payload) && (
                        <section>
                            <h1>{action}</h1>
                            <Payload root={body.payload} />
                        </section>
                    )}
                </content>
                <aside>
                    {(body && body.example) && (
                        <section>
                            <h1>Example request body</h1>
                            <Code lang="json" code={body.example} />
                        </section>
                    )}
                    {(method.method) && (
                        <section>
                            <h1>Example curl request</h1>
                                <Code lang="sh" code={helper.getCurl(exampleAbsoluteUri, method.method.toUpperCase(), '{your_api_key}')} />
                        </section>
                    )}
                </aside>
            </row>
        )
    },

    renderResponse: function () {
        var response = helper.getSuccessResponseFromMethod(this.props.method)
        if (!response.payload) return null

        return (
            <row>
                <content>
                    <section>
                        <Payload root={response.payload} />
                    </section>
                </content>
                <aside>
                    {(response.example) && (
                        <section>
                            <h1>Example response</h1>
                            <Code lang="json" code={response.example} />
                        </section>
                    )}
                </aside>
            </row>
        )
    },

    tabClickHandler: function (tab) {
        this.setState({
            activeTab: tab,
        })
    },

})
