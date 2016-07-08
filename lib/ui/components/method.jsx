var _ = require('lodash')
var Code = require('./code.jsx')
var React = require('react')
var helper = require('../../helper')
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var Payload = require('./payload.jsx')
var Tabs = require('./tabs.jsx')
var querystring = require('querystring')

var DEFAULT_CRUMBS = ['/']
var TABS = ['Request', 'Response']
var ROOT_PATH = ['root']

module.exports = React.createClass({
    displayName: 'Method',

    contextTypes: {
        onChange: React.PropTypes.func,
        slug: React.PropTypes.string,
    },

    propTypes: {
        method: React.PropTypes.shape({
            description: React.PropTypes.string,
            displayName: React.PropTypes.string.isRequired,
            method: React.PropTypes.string.isRequired,
        }).isRequired,
        baseUri: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired,
    },

    getInitialState: function () {
        return {
            activeTab: _.first(TABS),
            requestPayload: this.getInitialPayloadState(),
            responsePayload: this.getInitialPayloadState(),
        }
    },

    componentDidUpdate: function () {
        var obj = this.getTabState(this.state.activeTab === 'Request')
        var slug = (this.state.activeTab === 'Request' ? 'request' : 'response') + '.' + obj.currPath.join('.')
        slug = obj.paths[obj.currPath] ? (slug + '.object.' + obj.paths[obj.currPath].subType) : slug
        if (this.props.onChange) this.props.onChange(slug, obj.crumbs)
        if (this.context.onChange) this.context.onChange()
    },

    componentWillMount: function () {
        var slug = this.context.slug
        if (slug) {
            var re = new RegExp('.*' + this.props.method.slug + '.*')
            if (slug.match(re)) {
                if (slug.indexOf('?') !== -1) {
                    slug = slug.substring(0, slug.indexOf('#'))
                    var queryParameters = querystring.parse(slug.substring(slug.indexOf('?') + 1))
                    var path = queryParameters.path.indexOf('.') === -1 ? ROOT_PATH : queryParameters.path.substring(queryParameters.path.indexOf('.') + 1).split('.')
                    var crumbs = queryParameters.crumbs ? queryParameters.crumbs.split(',') : []
                    var isRequest = slug.match(/request/) != null
                    this.tabClickHandler(isRequest ? TABS[0] : TABS[1])
                    var i = 1
                    var k = 1
                    var partialPath = ROOT_PATH
                    while (i < path.length) {
                        var until = _.slice(path, 0, i)
                        if (path[i] === 'object') {
                            partialPath = partialPath.concat(_.slice(path, i, i + 5))
                            i = i + 5
                            if (path[i] === 'array') {
                                partialPath = partialPath.concat(_.slice(path, i, i + 3))
                                i = i + 3
                            }
                        } else {
                            i++
                        }
                        partialPath = _.map(partialPath, function (part) {
                            return !isNaN(part) ? _.toNumber(part) : part
                        })
                        var index = _.findLastIndex(partialPath, function (val, i) {
                            if (i > 0) {
                                return _.isNumber(val) && partialPath[i - 1] === 'object'
                            }
                            return false
                        })
                        if (partialPath.length > 1 && partialPath[index] !== 0) {
                            this.subTypeClickhandler(isRequest, until, partialPath[index])
                        }
                        if (partialPath.length > 1 && partialPath[partialPath.length - 2] === 'object') {
                            partialPath = _.slice(partialPath, 0, partialPath.length - 2)
                        }
                        if (crumbs[k]) {
                            this.viewPropsHandler(isRequest, partialPath, crumbs[k])
                        }
                        k++
                    }
                }
            }
            window.history.replaceState(undefined, undefined, window.location.hash)
        }
    },

    getInitialPayloadState: function () {
        return {
            crumbs: DEFAULT_CRUMBS,
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
        return (
            <row>
                <content>
                    {(body && body.payload) && (
                        <section>
                            <h1>Body</h1>
                            <Payload root={body.payload} state={this.state.requestPayload}  slug={this.props.method.slug}
                                onTypeClick={this.typeClickHandler.bind(this, true)}
                                onSubTypeClick={this.subTypeClickhandler.bind(this, true)}
                                onBreadCrumbsClick={this.breadcrumbClickHandler.bind(this, true)}
                                onViewPropsClick={this.viewPropsHandler.bind(this, true)}
                            />
                        </section>
                    )}
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
        if (!response || !response.payload) return null

        return (
            <row>
                <content>
                    <section>
                        <h1>Body</h1>
                        <Payload root={response.payload} state={this.state.responsePayload} slug={this.props.method.slug}
                            onTypeClick={this.typeClickHandler.bind(this, false)}
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
        if (e) {
            e.preventDefault()
        }
        console.log(path);
        console.log(propKey);
        var obj = this.getTabState(isRequest)
        obj.prevPaths = _.concat(obj.prevPaths, [obj.currPath])
        obj.crumbs = _.concat(obj.crumbs, propKey)
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
