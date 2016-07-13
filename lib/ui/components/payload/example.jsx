var Code = require('../code.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Example',

    contextTypes: {
        onChange: React.PropTypes.func,
    },

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        example: React.PropTypes.string.isRequired,
        type: React.PropTypes.oneOf([
            'array',
            'boolean',
            'integer',
            'null',
            'number',
            'object',
            'string',
        ]).isRequired,
    },

    componentDidUpdate: function () {
        if (this.context.onChange) this.context.onChange()
    },

    getInitialState: function () {
        return {
            visible: false,
        }
    },

    toggle: function () {
        this.setState({
            visible: !this.state.visible,
        })
    },

    render: function () {
        if (!this.props.type || !this.props.example) return null
        var content = null
        if (this.props.type === 'object' || this.props.type === 'array') {
            content = <Code code={this.props.example} lang="json"/>
        } else {
            content = <pre><code className="inline">{this.props.example}</code></pre>
        }
        var example = (
            <div className="example">
                <a className="link" onClick={this.toggle}>Example</a>
                {this.state.visible && content}
            </div>
        )
        return this.props.example ? example : null
    },
})
