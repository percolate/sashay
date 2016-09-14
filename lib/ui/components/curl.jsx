var _ = require('lodash')
var Code = require('./code.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
const SECURED_BY = require('../../cli/constants').securedBy

const AUTH_HEADERS = {
    oauth2: { id: 'Bearer {your_access_token}' },
    httpBasic: { id: 'Basic {base64_client_id_secret}' },
    systemClient: { id: '{your_client_id}' },
}

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
        var url = getUrl(this.props.absoluteUri, this.props.method, this.props.queryParameters)
        return <Code lang="sh" code={getCurl(url, this.props.method, this.props.securedBy)} theme="dark" />
    },

})

module.exports._testGetUrl = getUrl
module.exports._testGetCurl = getCurl

function getUrl (url, method, params) {
    var queryString = _.chain(params)
        .map(function (param, key) {
            if (param.required || method === 'get' && key === 'scope_ids') {
                return `${key}={${key}}`
            }
        })
        .compact()
        .join('&')
        .value()

    return queryString ? `${url}?${queryString}` : url
}

function getCurl (url, method, securedBy) {
    var firstSecuredBy = _.isString(securedBy[0]) ? securedBy[0] : _.chain(securedBy[0]).keys().first().value()
    var authHeader = AUTH_HEADERS[firstSecuredBy].id
    return _.chain([
        `curl "${url}"`,
        `  -X "${method.toUpperCase()}"`,
        authHeader ? `  -H "Authorization: ${authHeader}"` : undefined,
        '  -H "Content-type: application/json; charset=utf-8"',
        method === 'put' || method === 'post' ? '  -d \'{body}\'' : undefined,
    ])
    .compact()
    .join(' \\\n')
    .value()
}
