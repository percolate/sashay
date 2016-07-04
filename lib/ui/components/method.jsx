var _ = require('lodash')
var Code = require('./code.jsx')
var React = require('react')
var helper = require('../../helper')
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var Payload = require('./payload.jsx')
var Tabs = require('./tabs.jsx')

var TABS = ['Request', 'Response']
var ROOT_PATH = ['root']

module.exports = React.createClass({
    displayName: 'Method',

    contextTypes: {
        onChange: React.PropTypes.func,
    },

    propTypes: {
        method: React.PropTypes.shape({
            description: React.PropTypes.string,
            displayName: React.PropTypes.string.isRequired,
            method: React.PropTypes.string,
        }).isRequired,
        baseUri: React.PropTypes.string.isRequired,
    },

    getInitialState: function () {
        var body = _.get(this.props.method, ['body', 'application/json'])
        var response = helper.getSuccessResponseFromMethod(this.props.method)
        return {
            activeTab: _.first(TABS),
            requestPayload: this.getInitialPayloadState(body ? body.payload : {}),
            responsePayload: this.getInitialPayloadState(response ? response : {}),
        }
    },

    componentDidUpdate: function () {
        if (this.context.onChange) this.context.onChange()
    },

    getInitialPayloadState: function (payload) {
        var type = _.first(_.keys(payload))
        return {
            crumbs: [type],
            currPath: ROOT_PATH,
            paths: {},
            prevPaths: [],
        }
    },

    getPathString: function (path) {
        if (!_.isArray(path)) throw new Error('path must be an array')
        return path.join(',')
    },

    getStateValue: function (obj, path, key) {
        var pathString = this.getPathString(path)
        return _.get(obj, key ? [pathString, key] : pathString)
    },

    getTabState: function (isRequest) {
        return isRequest ? this.state.requestPayload : this.state.responsePayload
    },

    setTabState: function (isRequest, obj, callback) {
        var key = isRequest ? 'requestPayload' : 'responsePayload'
        this.setState({
            [key]: obj,
        }, callback)
    },

    setStateValue: function (isRequest, path, key, value) {
        var obj = this.getTabState(isRequest)
        var data = this.getStateValue(obj, path) || {}
        data[key] = value

        obj.paths[this.getPathString(path)] = data
        this.setTabState(isRequest, obj)
    },

    render: function () {
        var { method } = this.props

        return (
            <div className="method">
                <row>
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
                            <Payload root={body.payload} state={this.state.requestPayload} onTypeClick={this.typeClickHandler.bind(this, true)}
                                onSubTypeClick={this.subTypeClickhandler.bind(this, true)}
                                onBreadCrumbsClick={this.breadcrumbClickHandler.bind(this, true)}
                                onViewPropsClick={this.viewPropsHandler.bind(this, true)}
                            />
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
                        <Payload root={response.payload} state={this.state.responsePayload} onTypeClick={this.typeClickHandler.bind(this, false)}
                            onSubTypeClick={this.subTypeClickhandler.bind(this, false)}
                            onBreadCrumbsClick={this.breadcrumbClickHandler.bind(this, false)}
                            onViewPropsClick={this.viewPropsHandler.bind(this, false)}
                        />
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

    typeClickHandler: function (isRequest, path, type) {
        this.setStateValue(isRequest, path, 'type', type)
    },

    subTypeClickhandler: function (isRequest, path, type) {
        this.setStateValue(isRequest, path, 'subType', type)
    },

    tabClickHandler: function (tab) {
        this.setState({
            activeTab: tab,
        })
    },

    viewPropsHandler: function (isRequest, path, propKey, callback, e) {
        e.preventDefault()
        var obj = this.getTabState(isRequest)
        obj.prevPaths.push(obj.currPath)
        obj.crumbs.push(propKey)
        obj.currPath = path

        this.setTabState(isRequest, obj, callback)
    },

    breadcrumbClickHandler: function (isRequest, name, index) {
        var obj = isRequest ? this.state.requestPayload : this.state.responsePayload
        obj.crumbs = _.take(obj.crumbs, index + 1)
        obj.currPath = obj.prevPaths[index]
        obj.prevPaths = _.take(obj.prevPaths, index)

        var key = isRequest ? this.state.requestPayload : this.state.responsePayload
        this.setState({
            [key]: obj,
        })
    },
})
