var _ = require('lodash')
var Code = require('./code.jsx')
var DeepLink = require('./deep-link.jsx')
var fromJS = require('immutable').fromJS
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var React = require('react')
var ReactDOM = require('react-dom')
var helper = require('../../cli/helper')
var isVisible = require('../helper').isVisible
var Map = require('immutable').Map
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var Payload = require('./payload.jsx')
var Tabs = require('./tabs.jsx')

var TABS = {
    request: { id: 'Request' },
    response: { id: 'Response' },
}
var INITIAL_PAYLOAD_STATE = {
    currPath: ['root'],
    paths: {},
}
var PARAMETER_TYPES = require('../constants').parameterTypes
var VALUES = require('../constants').values

module.exports = React.createClass({
    displayName: 'Method',
    propTypes: {
        method: React.PropTypes.shape({
            description: React.PropTypes.string,
            displayName: React.PropTypes.string.isRequired,
            method: React.PropTypes.string.isRequired,
            slug: React.PropTypes.string.isRequired,
        }).isRequired,
        baseUri: React.PropTypes.string.isRequired,
        onResize: React.PropTypes.func,
        initialRoute: React.PropTypes.instanceOf(Map),
    },

    getDefaultProps: function () {
        return {
            initialRoute: fromJS({}),
            onResize: _.noop,
        }
    },

    getInitialState: function () {
        return {
            activeTab: TABS.request.id,
            requestPayload: _.cloneDeep(INITIAL_PAYLOAD_STATE),
            responsePayload: _.cloneDeep(INITIAL_PAYLOAD_STATE),
        }
    },

    componentDidUpdate: function () {
        this.props.onResize()
    },

    componentWillMount: function () {
        if (this.props.initialRoute.get('slug') !== this.props.method.slug) return
        var isRequest = this.props.initialRoute.get('parameterType') !== PARAMETER_TYPES.response.id
        var activeTab = (isRequest) ? TABS.request.id : TABS.response.id
        this.setState({ activeTab: activeTab })
        var parameterPath = this.props.initialRoute.get('parameterPath')
        var obj
        if (!_.isEmpty(parameterPath)) {
            obj = this.getTabState(isRequest)
            obj.currPath = INITIAL_PAYLOAD_STATE.currPath.concat(_.dropRight(parameterPath.split(VALUES.pathDelimeter.id)))
            this.setTabState(isRequest, obj)
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
        var pathname = getPathnameFromRoute(fromJS({ slug: this.props.method.slug }))

        return (
            <div
                className="method"
                id={pathname}
            >
                <row>
                    <content>
                        <h3><DeepLink pathname={pathname} /> {method.displayName}</h3>
                        {this.renderMethod()}
                        {this.renderDescription()}
                    </content>
                    <aside />
                </row>
                <row className="tabs-section">
                    <content>
                        <Tabs
                            tabs={_.map(TABS, 'id')}
                            activeTab={this.state.activeTab}
                            onClick={this.tabClickHandler}
                            ref="tabs"
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
            case TABS.request.id: return this.renderRequest()
            case TABS.response.id: return this.renderResponse()
        }
    },

    renderRequest: function () {
        var { method, uriParameters, queryParameters } = this.props.method || {}
        var { payload, example } = _.get(this.props.method, ['body', 'application/json']) || {}
        var formParameters = _.get(this.props.method, ['body', 'application/x-www-form-urlencoded', 'formParameters'])
        var exampleAbsoluteUri = helper.addRequiredQueryParameters(this.props.baseUri, this.props.method)
        return (
            <row>
                <content>
                    {(payload) && (
                        <section>
                            <h1>Body</h1>
                            <Payload root={payload} state={this.state.requestPayload} onTypeClick={this.typeClickHandler.bind(this, true)}
                                onSubTypeClick={this.subTypeClickhandler.bind(this, true)}
                                onBreadCrumbsClick={this.breadcrumbClickHandler.bind(this, true)}
                                onViewPropsClick={this.viewPropsHandler.bind(this, true)}
                                onResize={this.props.onResize}
                                parentRoute={fromJS({
                                    parameterType: PARAMETER_TYPES.payload.id,
                                    slug: this.props.method.slug,
                                })}
                                ref="payload"
                            />
                        </section>
                    )}
                    {(formParameters) && (
                        <section>
                            <h1>Form data</h1>
                            <Parameters
                                parameters={formParameters}
                                parentRoute={fromJS({
                                    parameterType: PARAMETER_TYPES.formPayload.id,
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
                                    parameterType: PARAMETER_TYPES.params.id,
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
                                    parameterType: PARAMETER_TYPES.query.id,
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
                            <Code lang="json" code={example} theme="dark" />
                        </section>
                    )}
                    {(method && !formParameters) && (
                        <section>
                            <h1>Example curl request</h1>
                                <Code lang="sh" code={helper.getCurl(exampleAbsoluteUri, method.toUpperCase(), '{your_api_key}')} theme="dark" />
                        </section>
                    )}
                </aside>
            </row>
        )
    },

    renderResponse: function () {
        var { payload, example } = helper.getSuccessResponseFromMethod(this.props.method) || {}
        return (
            <row>
                <content>
                    <section>
                        <h1>{payload ? 'Body' : 'Empty body'}</h1>
                        {(payload) && (
                            <Payload root={payload} state={this.state.responsePayload} onTypeClick={this.typeClickHandler.bind(this, false)}
                                onSubTypeClick={this.subTypeClickhandler.bind(this, false)}
                                onBreadCrumbsClick={this.breadcrumbClickHandler.bind(this, false)}
                                onViewPropsClick={this.viewPropsHandler.bind(this, false)}
                                parentRoute={fromJS({
                                    parameterType: PARAMETER_TYPES.response.id,
                                    slug: this.props.method.slug,
                                })}
                                ref="payload"
                            />
                        )}
                    </section>
                </content>
                <aside>
                    {(example) && (
                        <section>
                            <h1>Example response</h1>
                            <Code lang="json" code={example} theme="dark" />
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

    viewPropsHandler: function (isRequest, path) {
        var obj = this.getTabState(isRequest)
        obj.currPath = path

        this.setTabState(isRequest, obj, function () {
            var el = ReactDOM.findDOMNode(this.refs.tabs)
            if (!isVisible(el)) {
                el.scrollIntoView()
            }
        }.bind(this))
    },

    breadcrumbClickHandler: function (isRequest, keyPath) {
        var obj = isRequest ? this.state.requestPayload : this.state.responsePayload
        obj.currPath = INITIAL_PAYLOAD_STATE.currPath.concat(keyPath)
        var key = isRequest ? this.state.requestPayload : this.state.responsePayload
        this.setState({
            [key]: obj,
        })
    },
})
