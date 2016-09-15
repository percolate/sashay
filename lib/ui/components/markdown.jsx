var hljs = require('highlight.js')
var marked = require('marked')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

var renderer = new marked.Renderer()
renderer.link = function (href, title, text) {
    if (!title) title = ''
    if (!href) href = ''

    var target = href.indexOf('#') === 0 ||
        href.indexOf('mailto:') === 0 ? '_self' : '_blank'

    return `<a href="${href}" title="${title}" target="${target}">${text}</a>`
}

var OPTIONS = {
    highlight: function (code, lang) {
        if (lang) {
            return hljs.highlight(lang, code).value
        }

        return hljs.highlightAuto(code).value
    },
    renderer: renderer,
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
