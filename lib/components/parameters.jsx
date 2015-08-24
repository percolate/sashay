var _ = require('lodash')
var marked = require('marked')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Parameters',
    propTypes: {
        parameters: React.PropTypes.array.isRequired,
    },

    render: function () {
        return (
            <div>
                <h6>Parameters</h6>
                <ul className="parameters">
                    {_.map(this.props.parameters, function (parameter, i) {
                        return (
                            <li key={i}>
                                <div className="parameter-spec">
                                    <div>{parameter.name}</div>
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
