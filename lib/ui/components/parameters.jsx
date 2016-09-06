var _ = require('lodash')
var DeepLink = require('./deep-link.jsx')
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var Map = require('immutable').Map
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var PropTypes = require('react').PropTypes
var React = require('react')

module.exports = React.createClass({

    displayName: 'Parameters',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        parameters: PropTypes.object.isRequired,
        parentRoute: PropTypes.instanceOf(Map).isRequired,
    },

    render: function () {
        return (
            <div>
                <ul className="parameters">
                    {_.map(this.props.parameters, function (parameter, id) {
                        var pathname = getPathnameFromRoute(this.props.parentRoute.merge({
                            parameterPath: id,
                        }))
                        return (
                            <li
                                className="parameter"
                                id={pathname}
                                key={id}
                            >
                                <div className="parameter-spec">
                                    <div><DeepLink pathname={pathname} /> {parameter.displayName}</div>
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
