var hljs = require('highlight.js')
var marked = require('marked')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

var OPTIONS = {
    highlight: function (code, lang) {
        if (lang) {
            return hljs.highlight(lang, code).value
        }

        return hljs.highlightAuto(code).value
    },
}

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
                    __html: marked(this.props.content, OPTIONS),
                }}
                className="markdown"
            />
        )
    },

})
