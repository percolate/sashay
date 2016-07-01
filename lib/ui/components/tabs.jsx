var _ = require('lodash')
var EasyTabs = require('easy-tabs')
var Panel = EasyTabs.Panel
var PanelContainer = EasyTabs.PanelContainer
var Parameters = require('./parameters.jsx')
var Payload = require('./payload.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var Tabs = EasyTabs.Tabs
var TabList = EasyTabs.TabList
var Tab = EasyTabs.Tab
var helper = require('../../helper')

var TABS = {
    QUERY: 'Query',
    URI: 'URI',
    REQUEST: 'Request',
    RESPONSE: 'Response',
}

module.exports = React.createClass({

    displayName: 'Tabs',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        method: React.PropTypes.object.isRequired,
        onSelect: React.PropTypes.func.isRequired,
    },

    prepareTabsData: function (method) {
        if (!method) {
            return null
        }
        var body = _.get(method, [
            'body',
            'application/json',
        ])
        var successResponse = helper.getSuccessResponseFromMethod(method)
        var tabs = []
        var panels = []
        var tabNames = []
        if (!_.isEmpty(method.queryParameters)) {
            tabs.push(<Tab key="query" className="tabs__item">{TABS.QUERY}</Tab>)
            panels.push(<Panel key="query" className="tabs__content">
                <Parameters parameters={method.queryParameters} />
            </Panel>)
            tabNames.push(TABS.QUERY)
        }
        if (!_.isEmpty(method.uriParameters)) {
            tabs.push(<Tab key="uri" className="tabs__item">{TABS.URI}</Tab>)
            panels.push(<Panel key="uri" className="tabs__content">
                <Parameters parameters={method.uriParameters} />
            </Panel>)
            tabNames.push(TABS.URI)
        }
        if (!_.isEmpty(_.get(body, 'payload'))) {
            tabs.push(<Tab key="request" className="tabs__item">{TABS.REQUEST}</Tab>)
            panels.push(<Panel key="request" className="tabs__content">
                <Payload root={body.payload} />
            </Panel>)
            tabNames.push(TABS.REQUEST)
        }
        if (!_.isEmpty(_.get(successResponse, 'payload'))) {
            tabs.push(<Tab key="response" className="tabs__item">{TABS.RESPONSE}</Tab>)
            panels.push(<Panel key="response" className="tabs__content">
                <Payload root={successResponse.payload} />
            </Panel>)
            tabNames.push(TABS.RESPONSE)
        }
        return {
            tabs: tabs,
            panels: panels,
            tabNames: tabNames,
        }
    },

    render: function () {
        var tabData = this.prepareTabsData(this.props.method)

        return (
            <Tabs className="tabs" defaultTab={1} activeClassName="is-active" onSelect={this.props.onSelect.bind(null, tabData.tabNames, this.props.method.absoluteUri + '-' + this.props.method.method)}>
                <TabList className="tabs__list">
                    {tabData.tabs}
                </TabList>
                <PanelContainer className="tabs__container">
                    {tabData.panels}
                </PanelContainer>
            </Tabs>
        )
    },

})
