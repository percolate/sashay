var getHashFromPathname = require('../helper').getHashFromPathname
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'DeepLink',
    mixins: [PureRenderMixin],
    propTypes: {
        pathname: PropTypes.string.isRequired,
    },

    render: function () {
        return (
            <a
                className="deepLink"
                href={getHashFromPathname(this.props.pathname)}
            >#</a>
        )
    },
})
