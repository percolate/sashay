var _ = require('lodash')
var Markdown = require('./markdown.jsx')
var Parameter = require('./parameter.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactDOM = require('react-dom')

var ROOT = 'root'

module.exports = React.createClass({
    expanded: false,
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
            pattern: React.PropTypes.string,
            properties: React.PropTypes.object,
            required: React.PropTypes.bool,
            type: React.PropTypes.any,
        }),
        onChange: React.PropTypes.func.isRequired,
        onClick: React.PropTypes.func,
    },

    render: function () {
        var parameters = _.chain(this.props.parameters)
            .map(function (parameter, key) {
                parameter.displayName = key
                return parameter
            })
            .sortBy(function (parameter) {
                return parameter.displayName
            })
            .value()
        return (
            <div>
                <ul className="parameters">
                    {_.map(parameters, function (parameter, key) {
                        return (
                            <li
                                className="parameter"
                                key={key}
                            >
                                <Parameter parameter={parameter} onChange={this.props.onChange} onClick={this.props.onClick}/>
                            </li>
                        )
                    }.bind(this))}
                </ul>
            </div>
        )
    },
})
