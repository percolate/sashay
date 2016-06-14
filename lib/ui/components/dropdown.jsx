var _ = require('lodash')
var classNames = require('classnames')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Dropdown',

    propTypes: {
        label: React.PropTypes.node,
        noLabelArrow: React.PropTypes.bool,
        options: React.PropTypes.arrayOf(
            React.PropTypes.oneOfType([
                React.PropTypes.shape({
                    label: React.PropTypes.string.isRequired,
                    value: React.PropTypes.node,
                }),
                React.PropTypes.shape({
                    heading: React.PropTypes.string.isRequired,
                }),
                React.PropTypes.shape({
                    element: React.PropTypes.element.isRequired,
                    value: React.PropTypes.node,
                }),
            ])
        ),
        open: React.PropTypes.bool,
        position: React.PropTypes.oneOf(['left', 'right']),
        onClick: React.PropTypes.func,
    },

    getDefaultProps: function () {
        return {
            onClick: function () {},
            options: [],
            position: 'right',
        }
    },

    getInitialState: function () {
        return {
            open: _.isBoolean(this.props.open) ? this.props.open : false,
        }
    },

    componentWillReceiveProps: function (nextProps) {
        if (_.isBoolean(nextProps.open)) {
            this.setState({
                open: nextProps.open,
            })
        }
    },

    shouldComponentUpdate: function (nextProps, nextState) {
        if (!_.isEqual(_.omit(this.props, 'open'), _.omit(nextProps, 'open'))) return true
        if (!_.isEqual(this.state, nextState)) return true
        return false
    },

    componentDidMount: function () {
        this.manageEvents()
    },

    componentDidUpdate: function () {
        this.manageEvents()
    },

    componentWillUnmount: function () {
        this.unbindEvents()
    },

    render: function () {
        var classes = classNames('reactDropdown', {
            open: this.state.open,
            closed: !this.state.open,
            left: this.props.position === 'left',
            right: this.props.position === 'right',
        })

        return (
            <div className={classes}>
                <span className="trigger" onClick={this.handleTriggerClick}>{this.renderLabel()}</span>
                <div className="menu">
                    {_.map(this.props.options, function (option) {
                        if (option.element) {
                            return (
                                <div
                                    className="menuItem"
                                    onClick={_.bind(this.handleItemClick, this, option.value)}
                                    key={option.value}
                                >
                                    {option.element}
                                </div>
                            )
                        }
                        if (option.heading) {
                            return (
                                <div className="menuItemHeading" key={option.heading}>
                                    <h3 className="flush">{option.heading}</h3>
                                </div>
                            )
                        }
                        return (
                            <div
                                className="menuItem"
                                onClick={_.bind(this.handleItemClick, this, option.value)}
                                key={option.label}
                            >
                                {option.label}
                            </div>
                        )
                    }.bind(this))}
                </div>
            </div>
        )
    },

    renderLabel: function () {
        if (this.props.noLabelArrow) return <span>{this.props.label}</span>

        return (
            <span>
                {this.props.label} <div className="arrow-down"></div>
            </span>
        )
    },

    manageEvents: function () {
        if (this.state.open) {
            this.bindEvents()
        } else {
            this.unbindEvents()
        }
    },

    bindEvents: function () {
        document.addEventListener('click', this.handleDocumentClick, false)
    },

    unbindEvents: function () {
        document.removeEventListener('click', this.handleDocumentClick, false)
    },

    handleTriggerClick: function (e) {
        e.preventDefault()

        this.setState({
            open: !this.state.open,
        })
    },

    handleDocumentClick: function () {
        this.setState({
            open: false,
        })
    },

    handleItemClick: function (value) {
        this.props.onClick(value)
    },
})
