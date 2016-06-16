var _ = require('lodash')
var Select = require('./dropdown.jsx')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactDOM = require('react-dom')

var ROOT = 'root'
module.exports = React.createClass({
    expanded: false,
    showNested: false,
    displayName: 'Parameters',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        parameters: React.PropTypes.shape({
            default: React.PropTypes.string,
            displayName: React.PropTypes.string,
            enum: React.PropTypes.array,
            pattern: React.PropTypes.string,
            required: React.PropTypes.bool,
            type: React.PropTypes.any,
        }),
        onClick: React.PropTypes.func,
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
                                    <div>
                                      {(parameter.properties || _.has(parameter, ['items', 'properties'])) && (
                                          <a onClick={this.props.onClick.bind(null, parameter)}>{parameter.displayName}</a>
                                      )}
                                      {!parameter.properties && !_.has(parameter, ['items', 'properties']) && parameter.displayName}
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
        var types = _.map(property.type, function (type) {
            if (type === 'array') {
                if (_.isArray(_.get(property, ['items', 'type'], ['string']))) {
                  return '(' + _.map(_.get(property, ['items', 'type'], ['string']), function (t) {
                      return t == null ? 'null' : t.concat('[]')
                  }).join(' | ') + ')'
                }
                return _.get(property, ['items', 'type'], ['string']).concat('[]')
            } else {
                return type
            }
        })
        return types.join(' | ')
    }
    return (property.type === 'array') ? _.get(property, ['items', 'type'], 'string').concat('[]') : property.type
}
