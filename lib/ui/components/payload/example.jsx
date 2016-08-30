var Code = require('../code.jsx')
var noop = require('lodash/noop')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Example',
    propTypes: {
        code: React.PropTypes.string.isRequired,
        onResize: React.PropTypes.func,
    },

    componentDidUpdate: function () {
        this.props.onResize()
    },

    getDefaultProps: function () {
        return {
            onResize: noop,
        }
    },

    getInitialState: function () {
        return {
            expanded: false,
        }
    },

    render: function () {
        return (
            <div className="example">
                <span className="example-label">example:</span>
                <a className="example-toggler" href="#" onClick={this.toggleHandler}>{this.state.expanded ? 'hide' : 'show'}</a>
                {(this.state.expanded) && (<Code code={this.props.code} lang="json"/>)}
            </div>
        )
    },

    toggleHandler: function (e) {
        e.preventDefault()

        this.setState({
            expanded: !this.state.expanded,
        })
    },

})
