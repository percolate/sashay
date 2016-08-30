var _ = require('lodash')
var App = require('./app.jsx')
var createClass = require('react').createClass
var PropTypes = require('react').PropTypes
var WebFont = require('webfontloader')

var PROP_TYPES = require('../constants').propTypes
var LOGO = require('../img/api-logo-white.png')
var DEBOUNCE_DELAY = 20

require('../less/index.less')

module.exports = createClass({
    displayName: 'ControlledApp',
    propTypes: {
        baseUri: PropTypes.string.isRequired,
        groups: PropTypes.array.isRequired,
        hash: PropTypes.string,
        topics: PROP_TYPES.topics.id,
        version: PropTypes.string.isRequired,
    },

    _updateOffsets: function () {
        this._offsets = _.chain(this.refs.app.refs.main.refs)
            .map(function (ref, slug) {
                if (slug === 'main') return undefined
                return {
                    top: ref.getBoundingClientRect().top + window.pageYOffset,
                    slug: slug,
                }
            })
            .compact()
            .sortBy('top')
            .value()
    },

    _updateHash: function (ignoreHistory) {
        var offset = _.findLast(this._offsets, function (_offset) {
            return (window.pageYOffset + 100) > _offset.top
        })
        var slug = offset ? offset.slug : undefined
        if (slug === this.state.hash) return
        this.setState({ hash: slug })
        var url = slug ? ['#', slug].join('') : ' '
        if (ignoreHistory !== true) {
            window.history.replaceState(undefined, undefined, url)
        }
    },

    componentDidMount: function () {
        WebFont.load({
            active: function () {
                this._updateOffsets()
                this._updateHash(true)
            }.bind(this),
            custom: {
                families: ['InterFace'],
            },
        })
        window.addEventListener('resize', this.onResize)
        window.addEventListener('scroll', this.onScroll)
    },

    componentWillUnmount: function () {
        window.removeEventListener('resize', this.onResize)
        window.removeEventListener('scroll', this.onScroll)
    },

    getInitialState: function () {
        return {
            hash: undefined,
        }
    },

    onResize: _.debounce(function () {
        this._updateOffsets()
        this._updateHash()
    }, DEBOUNCE_DELAY),

    onScroll: _.debounce(function () {
        this._updateHash()
    }, DEBOUNCE_DELAY),

    render: function () {
        return (
            <App
                baseUri={this.props.baseUri}
                groups={this.props.groups}
                hash={this.state.hash}
                logo={LOGO}
                onResize={this.onResize}
                ref="app"
                topics={this.props.topics}
                version={this.props.version}
            />
        )
    },
})
