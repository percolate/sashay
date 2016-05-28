var _ = require('lodash')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var VisibilitySensor = require('react-visibility-sensor')

var ROOT = 'root'

module.exports = React.createClass({

    isBreadCrumbsVisible: false,
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
            pattern: React.PropTypes.string,
            properties: React.PropTypes.object,
            required: React.PropTypes.bool,
            type: React.PropTypes.any,
        }),
    },

    getInitialState: function () {
        var objects = {}
        objects[ROOT] = this.props.parameters
        return {
            breadcrumbs: this.props.parameters.isExpandable ? [ROOT] : null,
            objects: objects,
            selected: ROOT,
        }
    },

    displayNestedObject: function (object) {
        var index = _.indexOf(this.state.breadcrumbs, object.displayName)
        if (index === -1) {
            var objects = this.state.objects
            objects[object.displayName] = object
            this.state.breadcrumbs.push(object.displayName)
            this.setState({
                breadcrumbs: this.state.breadcrumbs,
                objects: objects,
                selected: object.displayName,
            })
        } else {
            this.setState({
                breadcrumbs: _.dropRight(this.state.breadcrumbs, this.state.breadcrumbs.length - index - 1),
                selected: object.displayName,
            })
        }
        if (!this.isBreadCrumbsVisible) {
            this.refs.breadcrumbs.scrollIntoView()
        }
    },

    onBreadCrumbsVisibilityChange: function (isVisible) {
        this.isBreadCrumbsVisible = isVisible
    },

    createBreadCrumbs: function (parameters) {
        return _.map(this.state.breadcrumbs, function (breadcrumb, i) {
            var separator = i < this.state.breadcrumbs.length - 1 ? (<span className="separator">{'.'}</span>) : (<span/>)
            var parameterObject = breadcrumb === ROOT ? {
                displayName: ROOT,
                properties: parameters,
            } : parameters[breadcrumb]
            var el = breadcrumb !== this.state.selected ? <a onClick={this.displayNestedObject.bind(undefined, parameterObject)}>
                {breadcrumb}
                </a> : <a className="selected">{breadcrumb}</a>
            return (<span key={i}>{el}{separator}</span>)
        }.bind(this))
    },

    render: function () {
        var parameters = _.chain(this.state.selected !== ROOT ? this.state.objects[this.state.selected].properties : this.props.parameters)
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
                {this.props.parameters.isExpandable && (<VisibilitySensor onChange={this.onBreadCrumbsVisibilityChange}>
                      <div ref="breadcrumbs" className="breadcrumbs">{breadcrumbs}</div>
                </VisibilitySensor>)}
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
