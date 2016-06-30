var _ = require('lodash')
var Breadcrumbs = require('./payload/breadcrumbs.jsx')
var React = require('react')
var Primitive = require('./payload/primitive.jsx')
var Types = require('./payload/types.jsx')
var isVisible = require('./utils').isVisible

var ROOT_PATH = ['root']

module.exports = React.createClass({
    contextTypes: {
        onChange: React.PropTypes.func,
    },

    displayName: 'Payload',
    propTypes: {
        root: React.PropTypes.shape({
            object: React.PropTypes.arrayOf(React.PropTypes.shape({
                properties: React.PropTypes.objectOf(React.PropTypes.shape({
                    required: React.PropTypes.bool.isRequired,
                    types: React.PropTypes.object.isRequired,
                })).isRequired,
            })).isRequired,
        }).isRequired,
    },

    getInitialState: function () {
        return {
            crumbs: ['root'],
            currPath: ROOT_PATH,
            paths: {},
            prevPaths: [],
        }
    },

    componentDidUpdate: function () {
        if (this.context.onChange) this.context.onChange()
    },

    getSchema: function (path) {
        return _.get(this.props, path)
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

    getPathString: function (path) {
        if (!_.isArray(path)) throw new Error('path must be an array')
        return path.join(',')
    },

    getStateValue: function (path, key) {
        var pathString = this.getPathString(path)
        return _.get(this.state.paths, key ? [pathString, key] : pathString)
    },

    setStateValue: function (path, key, value) {
        var data = this.getStateValue(path) || {}
        data[key] = value

        var paths = this.state.paths
        paths[this.getPathString(path)] = data

        this.setState({
            paths: paths,
        })
    },

    render: function () {
        return (
            <div className="payload" ref="payload">
                {this.renderBreadcrumbs()}
                <Types
                    types={['object']}
                    currType="object"
                    onClick={this.subTypeClickhandler.bind(this, this.state.currPath)}
                />
                <Types
                    isSubTypes
                    types={this.getSubTypes(this.state.currPath)}
                    currType={this.getCurrSubType(this.state.currPath)}
                    onClick={this.subTypeClickhandler.bind(this, this.state.currPath)}
                />
                <Primitive
                    type={this.getCurrType(this.state.currPath)}
                    description={this.getCurrSchema(this.state.currPath).description}
                />
                <div className="properties-title">Properties:</div>
                {this.renderProps()}
            </div>
        )
    },

    renderBreadcrumbs: function () {
        if (this.state.crumbs.length <= 1) return undefined
        return (
            <Breadcrumbs
                crumbs={this.state.crumbs}
                onClick={this.breadcrumbClickHandler}
                ref="breadcrumbs"
            />
        )
    },

    renderProps: function () {
        var props = this.getCurrSchema(this.state.currPath).properties
        var sortedKeys = _.chain(props)
            .keys()
            .sort()
            .value()

        return (
            <ul className="properties">
                {_.map(sortedKeys, function (key) {
                    var prop = props[key]
                    var path = _.concat(this.getTypedPath(this.state.currPath), 'properties', key, 'types')

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
                                    onClick={this.typeClickHandler.bind(this, path)}
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
                    <a href="#" onClick={this.viewPropsHandler.bind(this, path, propKey)}>
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
                    onClick={this.subTypeClickhandler.bind(this, path)}
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
                            onClick={this.typeClickHandler.bind(this, path)}
                        />
                        {this.renderPropTypes(path, arrayKey)}
                    </div>
            </div>
        )
    },

    typeClickHandler: function (path, type) {
        this.setStateValue(path, 'type', type)
    },

    subTypeClickhandler: function (path, type) {
        this.setStateValue(path, 'subType', type)
    },

    viewPropsHandler: function (path, propKey, e) {
        e.preventDefault()

        var prevPaths = this.state.prevPaths
        var crumbs = this.state.crumbs

        prevPaths.push(this.state.currPath)
        crumbs.push(propKey)

        this.setState({
            crumbs,
            currPath: path,
            prevPaths,
        }, function () {
            if (this.refs.breadcrumbs && !isVisible(this.refs.breadcrumbs)) {
                this.refs.payload.scrollIntoView()
            }
        }.bind(this))
    },

    breadcrumbClickHandler: function (name, index) {
        var crumbs = _.take(this.state.crumbs, index + 1)
        var currPath = this.state.prevPaths[index]
        var prevPaths = _.take(this.state.prevPaths, index)

        this.setState({
            crumbs,
            currPath,
            prevPaths,
        })
    },
})
