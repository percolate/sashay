var marked = require('marked')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Markdown',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        content: React.PropTypes.string.isRequired,
    },

    render: function () {
        return (
            <div
                dangerouslySetInnerHTML={{
                    __html: marked(this.props.content),
                }}
                className="markdown"
            />
        )
    },

})
