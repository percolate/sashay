var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var PrismCode = require('react-prism').PrismCode
var util = require('util')

var LANG_CLASSNAME_TEMPLATE = 'language-%s'

module.exports = React.createClass({

    displayName: 'Code',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        lang: React.PropTypes.oneOf([
            'http',
            'javascript',
            'json',
            'sh',
        ]).isRequired,
        code: React.PropTypes.string.isRequired,
    },

    render: function () {
        var className = util.format(LANG_CLASSNAME_TEMPLATE, this.props.lang)

        return (
            <div className="code">
                <pre>
                    <PrismCode className={className}>{this.props.code}</PrismCode>
                </pre>
            </div>
        )
    },

})
