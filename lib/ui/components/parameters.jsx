var _ = require('lodash')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Parameters',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        parameters: React.PropTypes.object.isRequired,
    },

    render: function () {
        var parameters = _.chain(this.props.parameters)
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
        return (
            <div>
                <ul className="parameters">
                    {_.map(parameters, function (parameter, i) {
                        return (
                            <li
                                className="parameter"
                                key={i}
                            >
                                <div className="parameter-spec">
                                    <div>{parameter.displayName}</div>
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
                    }, this)}
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
    return (property.type === 'array') ? ['[', ']'].join(property.items.type ? property.items.type : 'string') : property.type
}
