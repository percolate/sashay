var _ = require('lodash')
var Breadcrumbs = require('./payload/breadcrumbs.jsx')
var React = require('react')
var Primitive = require('./payload/primitive.jsx')
var Types = require('./payload/types.jsx')
var isVisible = require('./utils').isVisible

module.exports = React.createClass({
    contextTypes: {
        onChange: React.PropTypes.func,
    },

    displayName: 'Payload',
    propTypes: {
        root: React.PropTypes.shape({
            array: React.PropTypes.arrayOf(React.PropTypes.shape({
                types: React.PropTypes.object.isRequired,
            })),
            object: React.PropTypes.arrayOf(React.PropTypes.shape({
                properties: React.PropTypes.objectOf(React.PropTypes.shape({
                    required: React.PropTypes.bool.isRequired,
                    types: React.PropTypes.object.isRequired,
                })).isRequired,
            })),
        }).isRequired,
        state: React.PropTypes.shape({
            crumbs: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
            currPath: React.PropTypes.array.isRequired,
            paths: React.PropTypes.object.isRequired,
            prevPaths: React.PropTypes.array.isRequired,
        }).isRequired,
        onTypeClick: React.PropTypes.func.isRequired,
        onSubTypeClick: React.PropTypes.func.isRequired,
        onBreadCrumbsClick: React.PropTypes.func.isRequired,
        onViewPropsClick: React.PropTypes.func.isRequired,
    },

    componentDidUpdate: function () {
        if (this.context.onChange) this.context.onChange()
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

    render: function () {
        var types = this.getRootTypes()
        var currType = this.getRootCurrType()
        return (
            <div className="payload" ref="payload">
                {this.renderBreadcrumbs()}
                <Types
                    types={types}
                    currType={currType}
                    onClick={this.props.onSubTypeClick.bind(this, this.props.state.currPath)}
                />
                <Types
                    isSubTypes
                    types={this.getSubTypes(this.props.state.currPath)}
                    currType={this.getCurrSubType(this.props.state.currPath)}
                    onClick={this.props.onSubTypeClick.bind(this, this.props.state.currPath)}
                />
                <Primitive
                    type={this.getCurrType(this.props.state.currPath)}
                    description={this.getCurrSchema(this.props.state.currPath).description}
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

    renderBreadcrumbs: function () {
        if (this.props.state.crumbs.length <= 1) return undefined
        return (
            <Breadcrumbs
                crumbs={this.props.state.crumbs}
                onClick={this.props.onBreadCrumbsClick}
                ref="breadcrumbs"
            />
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
                {_.map(sortedKeys, function (key) {
                    var prop = props[key]
                    var path = _.concat(this.getTypedPath(this.props.state.currPath), 'properties', key, 'types')

                    return (
                        <li className="property" key={key}>
                            <div className={`property-left ${prop.required && 'required'}`}>
                                <div className="property-key">
                                    {key}
                                </div>
                                <Types
                                    isStacked
                                    types={this.getTypes(path)}
                                    currType={this.getCurrType(path)}
                                    onClick={this.props.onTypeClick.bind(this, path)}
                                />
                            </div>
                            <div className="property-right">
                                {this.renderPropTypes(path, key)}
                                {this.renderArrayTypes(path, key)}
                            </div>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    renderPropTypes: function (path, propKey) {
        var type = this.getCurrType(path)
        var schema = this.getCurrSchema(path)

        var viewProps
        if (type === 'object' && !_.isEmpty(schema.properties)) {
            viewProps = (
                <div className="view-props-link">
                    <a href="#" onClick={this.props.onViewPropsClick.bind(this, path, propKey, function () {
                        if (this.refs.breadcrumbs && !isVisible(this.refs.breadcrumbs)) {
                            this.refs.payload.scrollIntoView()
                        }
                    }.bind(this))}
                    >
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
                    onClick={this.props.onSubTypeClick.bind(this, path)}
                />
                <Primitive
                    type={this.getCurrType(path)}
                    description={schema.description}
                    metadata={schema.metadata}
                />
                {viewProps}
            </div>
        )
    },

    renderArrayTypes: function (arrayPath, propKey) {
        var type = this.getCurrType(arrayPath)
        if (type !== 'array') return undefined

        var arrayKey = `[ ${propKey} ]`
        var path = _.concat(this.getTypedPath(arrayPath), 'types')
        return (
            <div className="array-types-wrapper">
                <div className="array-types-title">Array items:</div>
                    <div className="array-types">
                        <Types
                            types={this.getTypes(path)}
                            currType={this.getCurrType(path)}
                            onClick={this.props.onTypeClick.bind(this, path)}
                        />
                        {this.renderPropTypes(path, arrayKey)}
                    </div>
            </div>
        )
    },
})
