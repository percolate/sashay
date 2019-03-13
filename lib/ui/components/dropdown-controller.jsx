var Dropdown = require('./dropdown.jsx')
var findDOMNode = require('react-dom').findDOMNode
var List = require('immutable').List
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'DropdownController',
    mixins: [PureRenderMixin],
    propTypes: {
        className: PropTypes.string,
        onChange: PropTypes.func,
        options: PropTypes.instanceOf(List).isRequired,
        value: PropTypes.string.isRequired,
    },

    componentDidMount: function() {
        document.addEventListener('click', this.onClickDocument)
    },

    componentWillUnmount: function() {
        document.removeEventListener('click', this.onClickDocument)
    },

    getInitialState: function() {
        return {
            isOpen: false,
        }
    },

    onClickDocument: function(e) {
        if (!this.state.isOpen) return
        if (findDOMNode(this).contains(e.target)) return
        this.setState({ isOpen: false })
    },

    onClickOption: function(option) {
        this.setState({ isOpen: false })
        this.props.onChange(option)
    },

    onClickSwitch: function() {
        this.setState({ isOpen: !this.state.isOpen })
    },

    render: function() {
        return (
            <Dropdown
                className={this.props.className}
                isOpen={this.state.isOpen}
                onClickSwitch={this.onClickSwitch}
                onClickOption={this.onClickOption}
                options={this.props.options}
                value={this.props.value}
            />
        )
    },
})
