var dropRight = require('lodash/dropRight')
var fromJS = require('immutable').fromJS
var fromPairs = require('lodash/fromPairs')
var isEmpty = require('lodash/isEmpty')
var Map = require('immutable').Map
var noop = require('lodash/noop')
var Payload = require('./payload.jsx')
var PropTypes = require('react').PropTypes
var React = require('react')

var VALUES = require('../constants').values
var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'PayloadController',
    propTypes: {
        initialRoute: PropTypes.instanceOf(Map),
        onChange: PropTypes.func,
        onResize: PropTypes.func,
        parentRoute: React.PropTypes.instanceOf(Map).isRequired,
        schema: PROP_TYPES.payloadSchema,
    },

    getDefaultProps: function() {
        return {
            initialRoute: fromJS({}),
            onChange: noop,
            onResize: noop,
        }
    },

    getInitialState: function() {
        return {
            keyPath: fromJS(['root']),
            propertyTypeModifiers: fromJS({}),
        }
    },

    componentWillMount: function() {
        var parameterPath = this.props.initialRoute.get('parameterPath')
        if (isEmpty(parameterPath)) return
        this.setState({
            keyPath: this.getInitialState().keyPath.concat(
                dropRight(parameterPath.split(VALUES.pathDelimeter.id))
            ),
        })
    },

    componentWillReceiveProps: function() {
        this.setState(this.getInitialState())
    },

    onClickBreadcrumb: function(keyPath) {
        this.setState(
            {
                keyPath: this.getInitialState().keyPath.concat(keyPath),
            },
            this.props.onChange
        )
    },

    onClickPath: function(keyPath) {
        this.setState({ keyPath: fromJS(keyPath) }, this.props.onChange)
    },

    onClickSubtype: function(typeKeyPath, i) {
        this.setState({
            propertyTypeModifiers: this.state.propertyTypeModifiers.merge(
                fromJS(fromPairs([[typeKeyPath, { subType: i }]]))
            ),
        })
    },

    onClickType: function(typeKeyPath, type) {
        this.setState({
            propertyTypeModifiers: this.state.propertyTypeModifiers.merge(
                fromJS(fromPairs([[typeKeyPath, { type: type }]]))
            ),
        })
    },

    render: function() {
        return (
            <Payload
                onBreadCrumbsClick={this.onClickBreadcrumb}
                onResize={this.props.onResize}
                onSubTypeClick={this.onClickSubtype}
                onTypeClick={this.onClickType}
                onViewPropsClick={this.onClickPath}
                parentRoute={this.props.parentRoute}
                root={this.props.schema}
                state={{
                    currPath: this.state.keyPath.toJS(),
                    paths: this.state.propertyTypeModifiers.toJS(),
                }}
            />
        )
    },
})
