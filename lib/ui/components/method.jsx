var Code = require('./code.jsx')
var DeepLink = require('./deep-link.jsx')
var findDOMNode = require('react-dom').findDOMNode
var fromJS = require('immutable').fromJS
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var isVisible = require('../helper').isVisible
var Map = require('immutable').Map
var map = require('lodash/map')
var Markdown = require('./markdown.jsx')
var noop = require('lodash/noop')
var React = require('react')
var Request = require('./request.jsx')
var Response = require('./response.jsx')
var Tabs = require('./tabs.jsx')

var TABS = {
    request: { id: 'Request' },
    response: { id: 'Response' },
}
var PARAMETER_TYPES = require('../constants').parameterTypes
var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'Method',
    propTypes: {
        method: PROP_TYPES.method,
        onResize: React.PropTypes.func,
        initialRoute: React.PropTypes.instanceOf(Map),
    },

    getDefaultProps: function () {
        return {
            initialRoute: fromJS({}),
            onResize: noop,
        }
    },

    getInitialState: function () {
        return {
            initialRoute: undefined,
            tab: TABS.request.id,
        }
    },

    componentDidUpdate: function () {
        this.props.onResize()
    },

    componentWillMount: function () {
        if (this.props.initialRoute.get('slug') !== this.props.method.slug) return
        var isRequest = this.props.initialRoute.get('parameterType') !== PARAMETER_TYPES.response.id
        var tab = (isRequest) ? TABS.request.id : TABS.response.id
        this.setState({
            initialRoute: this.props.initialRoute,
            tab: tab,
        })
    },

    onChangeTab: function (tab) {
        this.setState({ tab: tab })
    },

    onChangeTabContent: function () {
        var el = findDOMNode(this.refs.tabs)
        if (!isVisible(el)) {
            el.scrollIntoView()
        }
    },

    render: function () {
        var pathname = getPathnameFromRoute(fromJS({ slug: this.props.method.slug }))
        return (
            <div
                className="method"
                id={pathname}
            >
                <row>
                    <content>
                        <h3><DeepLink pathname={pathname} /> {this.props.method.displayName}</h3>
                        <section>
                            <Code lang="http" code={`${this.props.method.method.toUpperCase()} ${this.props.method.absoluteUri}`} />
                        </section>
                        {(this.props.method.description) && (
                            <section>
                                <Markdown content={this.props.method.description} />
                            </section>
                        )}
                    </content>
                    <aside />
                </row>
                <row>
                    <content>
                        <Tabs
                            activeTab={this.state.tab}
                            onChange={this.onChangeTab}
                            ref="tabs"
                            tabs={map(TABS, 'id')}
                        />
                    </content>
                    <aside />
                </row>
                {(function () {
                    switch (this.state.tab) {
                        case TABS.request.id: return (
                            <Request
                                initialRoute={this.state.initialRoute}
                                method={this.props.method}
                                onChange={this.onChangeTabContent}
                                onResize={this.props.onResize}
                            />
                        )
                        case TABS.response.id: return (
                            <Response
                                initialRoute={this.state.initialRoute}
                                method={this.props.method}
                                onChange={this.onChangeTabContent}
                                onResize={this.props.onResize}
                            />
                        )
                    }
                }.bind(this))()}
            </div>
        )
    },
})
