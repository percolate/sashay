var Main = require('./main.jsx')
var Map = require('immutable').Map
var Nav = require('./nav.jsx')
var noop = require('lodash/noop')
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

var PROP_TYPES = require('../constants').propTypes

module.exports = React.createClass({
    displayName: 'App',
    mixins: [PureRenderMixin],
    propTypes: {
        baseUri: PropTypes.string.isRequired,
        currentSlug: PropTypes.string,
        groups: PropTypes.array.isRequired,
        initialRoute: React.PropTypes.instanceOf(Map),
        logo: PropTypes.string,
        onResize: PropTypes.func,
        topics: PROP_TYPES.topics.id,
        version: PropTypes.string.isRequired,
    },

    getDefaultProps: function () {
        return {
            onResize: noop,
        }
    },

    render: function () {
        return (
            <div className="container">
                <Nav
                    currentSlug={this.props.currentSlug}
                    groups={this.props.groups}
                    logo={this.props.logo}
                    ref="nav"
                    topics={this.props.topics}
                />
                <Main
                    baseUri={this.props.baseUri}
                    groups={this.props.groups}
                    initialRoute={this.props.initialRoute}
                    onResize={this.props.onResize}
                    ref="main"
                    topics={this.props.topics}
                    version={this.props.version}
                />
            </div>
        )
    },
})
