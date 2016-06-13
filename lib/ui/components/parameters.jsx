var _ = require('lodash')
var Select = require('./dropdown.jsx')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactDOM = require('react-dom')

var ROOT = 'root'
module.exports = React.createClass({

    displayName: 'Parameters',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        parameters: React.PropTypes.shape({
            description: React.PropTypes.string,
            default: React.PropTypes.string,
            displayName: React.PropTypes.string,
            enum: React.PropTypes.array,
            isExpandable: React.PropTypes.bool,
            oneOf: React.PropTypes.array,
            pattern: React.PropTypes.string,
            properties: React.PropTypes.object,
            required: React.PropTypes.bool,
            type: React.PropTypes.any,
        }),
    },

    getInitialState: function () {
        var objects = {}
        objects[ROOT] = this.props.parameters
        var oneOfs = {}
        oneOfs[ROOT] = 0
        return {
            breadcrumbs: this.props.parameters.isExpandable || this.props.parameters.oneOf ? [ROOT] : null,
            objects: objects,
            oneOfs: oneOfs,
            selected: ROOT,
        }
    },

    displayNestedObject: function (object) {
        var index = _.indexOf(this.state.breadcrumbs, object.displayName)
        if (index === -1) {
            var objects = this.state.objects
            objects[object.displayName] = object
            this.state.breadcrumbs.push(object.displayName)
            var oneOfs = this.state.oneOfs
            oneOfs[object.displayName] = 0
            this.setState({
                breadcrumbs: this.state.breadcrumbs,
                objects: objects,
                oneOfs: oneOfs,
            })
        } else {
            this.setState({
                breadcrumbs: _.dropRight(this.state.breadcrumbs, this.state.breadcrumbs.length - index - 1),
            })
        }
        this.setState({
            selected: object.displayName,
        })
    },

    componentDidUpdate: function () {
        if (!this.isBreadCrumbsVisible()) {
            this.refs.breadcrumbs.scrollIntoView()
        }
    },

    isBreadCrumbsVisible: function () {
        var el = ReactDOM.findDOMNode(this.refs.breadcrumbs)
        var rect = el.getBoundingClientRect()
        var containmentRect = {
            top: 0,
            left: 0,
            bottom: window.innerHeight || document.documentElement.clientHeight,
            right: window.innerWidth || document.documentElement.clientWidth,
        }

        var visibilityRect = {
            top: rect.top >= containmentRect.top,
            left: rect.left >= containmentRect.left,
            bottom: rect.bottom <= containmentRect.bottom,
            right: rect.right <= containmentRect.right,
        }

        return (
            visibilityRect.top &&
            visibilityRect.left &&
            visibilityRect.bottom &&
            visibilityRect.right
        )
    },

    createBreadCrumbs: function (parameters) {
        return _.map(this.state.breadcrumbs, function (breadcrumb, i) {
            var separator = i < this.state.breadcrumbs.length - 1 ? (<span className="separator">{'.'}</span>) : (<span/>)
            var parameterObject = breadcrumb === ROOT ? {
                displayName: ROOT,
                properties: parameters,
            } : this.state.objects[breadcrumb]
            var el = breadcrumb !== this.state.selected ? <a onClick={this.displayNestedObject.bind(null, parameterObject)}>
                {breadcrumb}
                </a> : <a className="selected">{breadcrumb}</a>
            return (<span key={i}>{el}{separator}</span>)
        }.bind(this))
    },

    mapOneOfs: function (oneOf) {
        return _.map(oneOf, function (object, i) {
            return {
                label: 'Variant ' + (i + 1),
                value: i,
            }
        })
    },

    showOneOf: function (option) {
        var oneOfs = this.state.oneOfs
        oneOfs[this.state.selected] = option
        this.setState({
            oneOfs: _.clone(oneOfs),
        })
    },

    render: function () {
        var parametersObject = _.chain({})
            .extend(this.state.selected !== ROOT ? this.state.objects[this.state.selected].properties : this.props.parameters)
            .omit(['isExpandable', 'description'])
            .value()
        var oneOfs = _.chain(parametersObject)
            .filter(function (parameter, key) {
                return key === 'oneOf'
            })
            .flatten()
            .value()
        var parameters = _.chain(parametersObject)
            .extend(_.get(parametersObject, ['oneOf', this.state.oneOfs[this.state.selected]]))
            .filter(function (parameter, key) {
                return key !== 'oneOf'
            })
            .map(function (parameter) {
                if (_.has(parameter, 'schema')) return getParametersFromSchema(parameter.schema)
                return _.extend(parameter, {
                    type: getType(parameter),
                })
            })
            .flatten()
            .sortBy(function (parameter) {
                return parameter.displayName
            })
            .value()
        var breadcrumbs = this.createBreadCrumbs(parameters)
        return (
            <div>
                <div className="sub-menu">
                    <div ref="breadcrumbs" className="breadcrumbs">{breadcrumbs}</div>
                    {!_.isEmpty(oneOfs) && (<div className="reactDropdown-wrapper">
                          <Select options={this.mapOneOfs(oneOfs)} label={this.mapOneOfs(oneOfs)[this.state.oneOfs[this.state.selected]].label} onClick={this.showOneOf}/>
                    </div>)}
                </div>
                <ul className="parameters">
                    {_.map(parameters, function (parameter, i) {
                        return (
                            <li
                                className="parameter"
                                key={i}
                            >
                                <div className="parameter-spec">
                                    <div>
                                      {parameter.properties && (
                                          <a onClick={this.displayNestedObject.bind(this, parameter)}>{parameter.displayName}</a>
                                      )}
                                      {!parameter.properties && parameter.displayName}
                                    </div>
                                    <div className="parameter-info">
                                        <div>{parameter.type}</div>
                                        {(_.toString(parameter.default) !== '') && (
                                            <div className="parameter-info parameter-default">
                                                default is <strong>{JSON.stringify(parameter.default)}</strong>
                                            </div>
                                        )}
                                    </div>
                                    {(parameter.required)
                                        ?
                                            <div className="parameter-required">Required</div>
                                        :
                                            undefined
                                    }
                                </div>
                                <div className="parameter-desc">
                                    {(!_.isEmpty(parameter.description))
                                        ?
                                            <Markdown content={parameter.description} />
                                        :
                                            undefined
                                    }
                                    {!_.isNil(parameter.enum) && (
                                        <span>
                                            Allowed values: [{parameter.enum.join(', ')}]
                                        </span>
                                    )}
                                    {!_.isNil(parameter.pattern) && (
                                        <span>
                                            Pattern: {parameter.pattern}
                                        </span>
                                    )}
                                </div>
                            </li>
                        )
                    }.bind(this))}
                </ul>
            </div>
        )
    },

})

function getParametersFromSchema (schema) {
    return _.chain(schema.properties)
        .map(function (property, name) {
            return _.extend(property, {
                name: name,
                required: _.contains(schema.required, name),
                type: getType(property),
            })
        })
        .value()
}

function getType (property) {
    if (_.isArray(property.type)) {
        return property.type.join(' | ')
    }
    return (property.type === 'array') ? ['[', ']'].join(_.get(property, ['items', 'type'], 'string')) : property.type
}
