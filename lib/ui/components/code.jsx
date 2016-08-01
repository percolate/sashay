var hljs = require('highlight.js')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({

    displayName: 'Code',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        lang: React.PropTypes.string,
        code: React.PropTypes.string.isRequired,
        theme: React.PropTypes.oneOf(undefined, 'dark', 'light'),
    },

    getDefaultProps: function () {
        return {
            theme: 'light',
        }
    },

    render: function () {
        var { language, value } = this.highlight()
        return (
            <div className={`code ${this.props.theme}`}>
                <pre>
                    <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: value }} />
                </pre>
            </div>
        )
    },

    highlight: function () {
        var { lang, code } = this.props
        if (lang) {
            return hljs.highlight(lang, code)
        }
        return hljs.highlightAuto(code)
    },
})
