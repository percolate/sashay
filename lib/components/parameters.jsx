var _ = require('lodash')
var marked = require('marked')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Parameters',
    propTypes: {
        parameters: React.PropTypes.array.isRequired,
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
            .value()
        return (
            <div>
                <h6>Parameters</h6>
                <ul className="parameters">
                    {_.map(parameters, function (parameter, i) {
                        return (
                            <li
                                className="parameter"
                                key={i}
                            >
                                <div className="parameter-spec">
                                    <div>{parameter.name}</div>
                                    <div className="parameter-info">
                                        <span>{parameter.type}</span>
                                        {(!_.isEmpty(parameter.default)) && (
                                            <span>, default is <strong><code>{JSON.stringify(parameter.default)}</code></strong></span>
                                        )}
                                    </div>
                                    {(parameter.required)
                                        ?
                                            <div className="parameter-required">Required</div>
                                        :
                                            undefined
                                    }
                                </div>
                                {(!_.isEmpty(parameter.description))
                                    ?
                                        <div
                                            className="parameter-desc"
                                            dangerouslySetInnerHTML={{
                                                __html: marked(parameter.description),
                                            }}
                                        />
                                    :
                                        undefined
                                }

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
    return (property.type === 'array') ? ['[', ']'].join(property.items.type) : property.type
}
