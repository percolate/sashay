var _ = require('lodash')
var addRequiredQueryParameters = require('./helpers').addRequiredQueryParameters
var Code = require('./code.jsx')
var getCurl = require('./helpers').getCurl
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
const SECURED_BY = require('../../cli/constants').securedBy

module.exports = React.createClass({
    displayName: 'Curl',
    mixins: [PureRenderMixin],
    propTypes: {
        absoluteUri: React.PropTypes.string.isRequired,
        queryParameters: React.PropTypes.object,
        method: React.PropTypes.oneOf(['post', 'get', 'put', 'delete']).isRequired,
        securedBy: React.PropTypes.arrayOf(
            React.PropTypes.oneOfType([
                React.PropTypes.oneOf(_.keys(SECURED_BY)),
                React.PropTypes.shape({
                    oauth2: React.PropTypes.shape({
                        scopes: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
                    }).isRequired,
                }),
            ])
        ).isRequired,
    },

    render: function () {
        var url = addRequiredQueryParameters(this.props.absoluteUri, this.props.method, this.props.queryParameters)
        return <Code lang="sh" code={getCurl(url, this.props.method, this.props.securedBy)} theme="dark" />
    },
})
