var Code = require('../code.jsx')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Example',

    contextTypes: {
        onChange: React.PropTypes.func,
    },

    propTypes: {
        code: React.PropTypes.string.isRequired,
    },

    componentDidUpdate: function () {
        if (this.context.onChange) this.context.onChange()
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
