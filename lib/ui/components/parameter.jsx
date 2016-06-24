var _ = require('lodash')
var Markdown = require('./markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactDOM = require('react-dom')

module.exports = React.createClass({
    displayName: 'Property',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        onChange: React.PropTypes.func.isRequired,
        onClick: React.PropTypes.func,
    },

    getInitialState: function () {
        return {
            selectedType: _.keys(this.props.parameter.types)[0],
            selectedSubType: 0,
            selectedItemSubType: 0,
        }
    },

    changeType: function (type) {
        this.setState({
            selectedType: type,
        })
    },

    changeSubType: function (type) {
        this.setState({
            selectedSubType: type,
        })
    },

    componentDidUpdate: function () {
        if (this.props.onChange) {
            this.props.onChange()
        }
    },

    prepareItemSubTypes: function (t) {
        if (!this.state.selectedType) {
            return null
        }
        if (this.state.selectedType !== 'array') {
            return null
        }
        var itemSubTypes = _.get(this.props.parameter.types, this.state.selectedType, 0, 'types')
        var subTypes = null
        if (itemSubTypes.length > 1) {
            subTypes = _.map(itemSubTypes, function (subType, index) {
                return <span><a className={this.state.selectedSubType === index ? 'selected' : ''}
                      onClick={this.changeSubType.bind(this, index)}>{subType.title}</a>
                </span>
            }.bind(this))
        } else {
            subTypes = <span><a>{_.first(_.keys(itemSubTypes[0].types))}</a></span>
        }
        return <div className="parameter-subtypes">Array items: <div>{(itemSubTypes.length > 1 ? 'Subtypes: ' : '')}{subTypes}</div></div>
    },

    prepareItemDescription: function () {
        if (!this.state.selectedType) {
            return null
        }
        if (this.state.selectedType !== 'array') {
            return null
        }

        var itemSubTypes = _.get(this.props.parameter.types, [this.state.selectedType, 0, 'types'])
        var typeName = _.get(_.keys(itemSubTypes), this.state.selectedSubType)
        var type = _.get(itemSubTypes, [typeName, this.state.selectedItemSubType])

        if (typeName === 'object' || typeName === 'array') {
            return <div className="parameter-desc">
                {(!_.isEmpty(type.description))
                    ?
                        <Markdown content={type.description} />
                    :
                        undefined
                }
            </div>
        } else {
            return this.prepareDescription(type)
        }
    },

    prepareTypes: function () {
        var separator = <span className="separator">,</span>
        var count = 0
        return <div className="parameter-types">
            {_.map(this.props.parameter.types, function (type, key) {
                count++
                return <span key={key}>{count > 1 ? separator : ''}
                    <a className={this.state.selectedType === key ? 'selected' : ''} onClick={this.changeType.bind(this, key)}>{key}</a>
                </span>
                }.bind(this))
            }
        </div>
    },

    prepareSubTypes: function () {
        if (!this.state.selectedType) {
            return null
        }
        var subTypes = this.props.parameter.types[this.state.selectedType]
        if (subTypes.length === 1) {
            return null
        }
        return <div className="parameter-subtypes">subTypes: {_.map(subTypes, function (subType, index) {
            return <span key={index}><a className={this.state.selectedSubType === index ? 'selected' : ''}
                  onClick={this.changeSubType.bind(this, index)}>{subType.title}</a>
            </span>
        }.bind(this))}</div>
    },

    prepareDescription: function (type, displayName) {
        if (!type) {
            type = this.state.selectedType ? this.props.parameter.types[this.state.selectedType][this.state.selectedSubType] : {}
        }
        return <div className="parameter-desc">
            {(!_.isEmpty(type.description)) && <Markdown content={type.description} />}
            {!_.isNil(type.enum) && (
                <span>
                    Allowed values: [{type.enum.join(', ')}]
                </span>
            )}
            {!_.isNil(type.pattern) && (
                <span>
                    Pattern: {type.pattern}
                </span>
            )}
            {!_.isEmpty(type.properties) && <span><a onClick={this.props.onClick ? this.props.onClick.bind(null, type, displayName) : null}>
                View more details</a></span>}
        </div>
    },

    render: function () {
        var parameter = this.props.parameter
        return (
            <div className="parameter-wrapper">
                <div className="parameter-spec">
                    <div>
                      {parameter.properties && (
                          <a onClick={this.displayNestedObject.bind(this, parameter)}>{parameter.displayName}</a>
                      )}
                      {!parameter.properties && parameter.displayName}
                    </div>
                    <div className="parameter-info">
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
                {this.prepareTypes()}
                {parameter.description && <div>
                    {parameter.description}
                </div>}
                {this.prepareSubTypes()}
                {this.prepareDescription(undefined, parameter.displayName)}
                {this.prepareItemSubTypes()}
                {this.prepareItemDescription()}
            </div>
        )
    },

})
