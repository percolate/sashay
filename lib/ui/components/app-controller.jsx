var _ = require('lodash')
var App = require('./app.jsx')
var createClass = require('react').createClass
var fromJS = require('immutable').fromJS
var getHashFromRoute = require('../helper').getHashFromRoute
var getPathnameFromRoute = require('../helper').getPathnameFromRoute
var parseRoute = require('../helper').parseRoute
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')
var WebFont = require('webfontloader')

var PROP_TYPES = require('../constants').propTypes
var LOGO = require('../img/api-logo-white.png')
var DEBOUNCE_DELAY = 20

require('../less/index.less')

module.exports = createClass({
    displayName: 'ControlledApp',
    mixins: [PureRenderMixin],
    propTypes: {
        groups: PropTypes.array.isRequired,
        hash: PropTypes.string,
        topics: PROP_TYPES.topics.id,
        version: PropTypes.string.isRequired,
    },

    _updateOffsets: function () {
        var offsets = _.chain(this.refs.app.refs.main.refs)
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
        this.setState({
            offsets: offsets,
        })
    },

    _updateHash: function () {
        var offset = _.findLast(this.state.offsets, function (_offset) {
            return (window.pageYOffset + 100) > _offset.top
        })
        var slug = offset ? offset.slug : undefined
        if (slug === this.state.currentSlug) return
        this.setState({
            currentSlug: slug,
        })
        window.history.replaceState(undefined, undefined, getHashFromRoute(fromJS({ slug: slug })))
    },

    componentDidMount: function () {
        WebFont.load({
            active: function () {
                this._updateOffsets()
                var targetElement = document.getElementById(getPathnameFromRoute(this.state.initialRoute))
                if (targetElement) targetElement.scrollIntoView()
            }.bind(this),
            custom: {
                families: ['InterFace'],
            },
        })
        window.addEventListener('resize', this.onResize)
        window.addEventListener('scroll', this.onScroll)
    },

    componentWillMount: function () {
        var route = parseRoute(_.trimStart(window.location.hash, '#'))
        this.setState({
            currentSlug: route.get('slug'),
            initialRoute: route,
        })
    },

    componentWillUnmount: function () {
        window.removeEventListener('resize', this.onResize)
        window.removeEventListener('scroll', this.onScroll)
    },

    getInitialState: function () {
        return {
            currentSlug: undefined,
            initialRoute: fromJS({
                slug: undefined,
                parameterPath: undefined,
                parameterType: undefined,
            }),
            offsets: [],
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
                currentSlug={this.state.currentSlug}
                groups={this.props.groups}
                initialRoute={this.state.initialRoute}
                logo={LOGO}
                onResize={this.onResize}
                ref="app"
                topics={this.props.topics}
                version={this.props.version}
            />
        )
    },
})
