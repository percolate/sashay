var _ = require('lodash')
var React = require('react')
var PropTypes = require('./payload/property-types.jsx')
var Types = require('./payload/types.jsx')
var isVisible = require('./utils').isVisible

module.exports = React.createClass({
    contextTypes: {
        onChange: React.PropTypes.func,
    },

    displayName: 'Payload',
    propTypes: {
        types: React.PropTypes.shape({
            object: React.PropTypes.arrayOf(React.PropTypes.shape({
                properties: React.PropTypes.objectOf(React.PropTypes.shape({
                    required: React.PropTypes.bool.isRequired,
                    types: React.PropTypes.object.isRequired,
                })).isRequired,
            })).isRequired,
        }).isRequired,
    },

    getInitialState: function () {
        return this.buildState(this.props.types, [])
    },

    buildState: function (types, prevTypes) {
        if (!prevTypes) prevTypes = this.state.prevTypes
        return {
            prevTypes,
            properties: _.get(types, ['object', 0, 'properties']),
            types,
        }
    },

    componentDidUpdate: function () {
        if (this.refs.back && !isVisible(this.refs.back)) {
            this.refs.back.scrollIntoView()
        }
        if (this.context.onChange) {
            this.context.onChange()
        }
    },

    render: function () {
        return (
            <div className="payload">
                {this.renderBackLink()}
                <Types
                    ref="types"
                    types={this.state.types}
                    onSelect={this.typeSelectHandler}
                />
                <div className="properties-title">Properties:</div>
                {this.renderProps()}
            </div>
        )
    },

    renderBackLink: function () {
        if (_.isEmpty(this.state.prevTypes)) return undefined

        return <a href="javascript:void(0)" onClick={this.backLinkHandler} ref="back" className="back-link">Back to parent object</a>
    },

    renderProps: function () {
        if (_.isEmpty(this.state.properties)) {
            return (
                <ul className="properties">
                    <li className="property">
                        <div className="property-key">None</div>
                    </li>
                </ul>
            )
        }

        var props = this.state.properties
        var sortedKeys = _.chain(props)
            .keys()
            .sort()
            .value()

        return (
            <ul className="properties">
                {_.map(sortedKeys, function (key) {
                    var prop = props[key]

                    return (
                        <li
                            className="property"
                            key={key}
                        >
                            <div className={`property-key ${prop.required && 'required'}`}>
                                {key}
                            </div>
                            <div className="property-info">
                                <PropTypes types={prop.types} onViewObject={this.viewObjectHandler} />
                            </div>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    viewObjectHandler: function (types) {
        this.refs.types.storePreviousIndices()
        this.state.prevTypes.push(this.state.types)
        this.setState(this.buildState(types))
    },

    typeSelectHandler: function (object) {
        this.setState({
            properties: object.properties,
        })
    },

    backLinkHandler: function () {
        var prevTypes = this.state.prevTypes.pop()
        this.setState(this.buildState(prevTypes))
        this.refs.types.backLinkHandler()
    },
})
