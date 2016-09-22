var _ = require('lodash')
var Breadcrumbs = require('./payload/breadcrumbs.jsx')
var DeepLink = require('./deep-link.jsx')
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var Map = require('immutable').Map
var parsePayload = require('../helper').parsePayload
var Primitive = require('./payload/primitive.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var Types = require('./payload/types.jsx')

var VALUES = require('../constants').values
var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'Payload',

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        root: PROP_TYPES.payloadSchema,
        state: React.PropTypes.shape({
            currPath: React.PropTypes.array.isRequired,
            paths: React.PropTypes.object.isRequired,
        }).isRequired,
        onTypeClick: React.PropTypes.func.isRequired,
        onSubTypeClick: React.PropTypes.func.isRequired,
        onBreadCrumbsClick: React.PropTypes.func.isRequired,
        onViewPropsClick: React.PropTypes.func.isRequired,
        onResize: React.PropTypes.func,
        parentRoute: React.PropTypes.instanceOf(Map).isRequired,
    },

    getDefaultProps: function () {
        return {
            onResize: _.noop,
        }
    },

    getPathString: function (path) {
        if (!_.isArray(path)) throw new Error('path must be an array')
        return path.join(',')
    },

    getSchema: function (path) {
        return _.get(this.props, path)
    },

    getStateValue: function (path, key) {
        var pathString = this.getPathString(path)
        return _.get(this.props.state.paths, key ? [pathString, key] : pathString)
    },

    getTypes: function (path) {
        return _.keys(this.getSchema(path))
    },

    getSubTypes: function (path) {
        var subTypes = _.get(this.getSchema(path), this.getCurrType(path))
        return _.chain(subTypes)
            .map('title')
            .compact()
            .value()
    },

    getRootTypes: function () {
        return _.filter(this.getTypes(this.props.state.currPath), function (type) {
            return type === 'object' || type === 'array'
        })
    },

    getRootCurrType: function () {
        return this.getStateValue(this.props.state.currPath, 'type') || _.first(this.getRootTypes())
    },

    getCurrType: function (path) {
        return this.getStateValue(path, 'type') || _.first(this.getTypes(path))
    },

    getCurrSubType: function (path) {
        return this.getStateValue(path, 'subType') || 0
    },

    getCurrSchema: function (path) {
        return _.get(this.getSchema(path), [this.getCurrType(path), this.getCurrSubType(path)])
    },

    getTypedPath: function (path) {
        return _.concat(path, this.getCurrType(path), this.getCurrSubType(path))
    },

    onClickBreadcrumb: function (val) {
        this.props.onBreadCrumbsClick(val)
    },

    onClickPath: function (path, propKey) {
        this.props.onViewPropsClick(path, propKey)
    },

    onClickSubtype: function (val, i) {
        this.props.onSubTypeClick(val, i)
    },

    onClickType: function (keyPath, type) {
        this.props.onTypeClick(keyPath, type)
    },

    render: function () {
        var types = this.getRootTypes()
        var currType = this.getRootCurrType()
        var pathKeys = parsePayload(this.props.state.currPath.slice(1), this.props.root)
        return (
            <div className="payload">
                {(!pathKeys.isEmpty()) && (
                    <Breadcrumbs
                        pathKeys={pathKeys}
                        onClick={this.props.onBreadCrumbsClick}
                    />
                )}
                <Types
                    types={types}
                    currType={currType}
                    onClick={this.onClickType.bind(this, this.props.state.currPath)}
                />
                <Types
                    isSubTypes
                    types={this.getSubTypes(this.props.state.currPath)}
                    currType={this.getCurrSubType(this.props.state.currPath)}
                    onClick={this.onClickSubtype.bind(this, this.props.state.currPath)}
                />
                <Primitive
                    type={this.getCurrType(this.props.state.currPath)}
                    description={this.getCurrSchema(this.props.state.currPath).description}
                    example={this.getCurrSchema(this.props.state.currPath).example}
                    onResize={this.props.onResize}
                />
                {(currType === 'object') && (
                    <div>
                        <div className="properties-title">Properties:</div>
                        {this.renderProps()}
                    </div>
                )}
                {(currType === 'array') && this.renderArrayTypes(this.props.state.currPath, '')}
            </div>
        )
    },

    renderProps: function () {
        var props = this.getCurrSchema(this.props.state.currPath).properties
        var sortedKeys = _.chain(props)
            .keys()
            .sort()
            .value()

        return (
            <ul className="properties">
                {(_.isEmpty(props)) && (
                    <li className="property">
                        <div className="property-left">
                            <div className="property-key">None</div>
                        </div>
                        <div className="property-right"></div>
                    </li>
                )}
                {_.map(sortedKeys, function (key) {
                    var prop = props[key]
                    var path = _.concat(this.getTypedPath(this.props.state.currPath), 'properties', key, 'types')
                    var pathname = getPathnameFromRoute(this.props.parentRoute.merge({
                        parameterPath: _.tail(this.props.state.currPath).concat([key]).join(VALUES.pathDelimeter.id),
                    }))

                    return (
                        <li
                            className="property"
                            id={pathname}
                            key={key}
                        >
                            <div className={`property-left ${prop.required && 'required'}`}>
                                <div className="property-key"><DeepLink pathname={pathname} /> {key}</div>
                                <Types
                                    isStacked
                                    types={this.getTypes(path)}
                                    currType={this.getCurrType(path)}
                                    onClick={this.onClickType.bind(this, path)}
                                />
                            </div>
                            <div className="property-right">
                                {this.renderPropTypes(path)}
                                {this.renderArrayTypes(path)}
                            </div>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    renderPropTypes: function (path) {
        var type = this.getCurrType(path)
        var schema = this.getCurrSchema(path)

        var viewProps
        if (type === 'object' && !_.isEmpty(schema.properties)) {
            viewProps = (
                <div className="view-props-link">
                    <a href="javascript:void(0)" onClick={this.onClickPath.bind(this, path)}>
                        View {schema.title || type} properties
                    </a>
                </div>
            )
        }

        return (
            <div className="prop-types">
                <Types
                    isSubTypes
                    types={this.getSubTypes(path)}
                    currType={this.getCurrSubType(path)}
                    onClick={this.onClickSubtype.bind(this, path)}
                />
                <Primitive
                    type={this.getCurrType(path)}
                    description={schema.description}
                    metadata={schema.metadata}
                    example={schema.example}
                />
                {viewProps}
            </div>
        )
    },

    renderArrayTypes: function (arrayPath) {
        var type = this.getCurrType(arrayPath)
        if (type !== 'array') return undefined

        var path = _.concat(this.getTypedPath(arrayPath), 'types')
        return (
            <div className="array-types-wrapper">
                <div className="array-types-title">Array items:</div>
                    <div className="array-types">
                        <Types
                            types={this.getTypes(path)}
                            currType={this.getCurrType(path)}
                            onClick={this.onClickType.bind(this, path)}
                        />
                        {this.renderPropTypes(path)}
                    </div>
            </div>
        )
    },
})
