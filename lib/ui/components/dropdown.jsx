var classNames = require('classnames')
var List = require('immutable').List
var noop = require('lodash/noop')
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Dropdown',
    mixins: [PureRenderMixin],
    propTypes: {
        className: PropTypes.string,
        isOpen: PropTypes.bool,
        onClickOption: PropTypes.func,
        onClickSwitch: PropTypes.func,
        options: PropTypes.instanceOf(List).isRequired,
        value: PropTypes.string.isRequired,
    },

    getDefaultProps: function() {
        return {
            isOpen: false,
            onClickSwitch: noop,
            onClickOption: noop,
        }
    },

    onClickSwitch: function() {
        this.props.onClickSwitch()
    },

    onClickOption: function(option) {
        this.props.onClickOption(option)
    },

    render: function() {
        return (
            <div className={classNames('dropdown', this.props.className)}>
                <div className="dropdown-switch" onClick={this.onClickSwitch}>
                    {this.props.value}
                </div>
                {this.props.isOpen && (
                    <div className="dropdown-body">
                        {this.props.options
                            .map(
                                function(option) {
                                    return (
                                        <div key={option}>
                                            {this.props.value === option ? (
                                                <span>{option}</span>
                                            ) : (
                                                <a
                                                    href="javascript:void(0)"
                                                    onClick={this.onClickOption.bind(
                                                        this,
                                                        option
                                                    )}
                                                >
                                                    {option}
                                                </a>
                                            )}
                                        </div>
                                    )
                                }.bind(this)
                            )
                            .valueSeq()}
                    </div>
                )}
            </div>
        )
    },
})
