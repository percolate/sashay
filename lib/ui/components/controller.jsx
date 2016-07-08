var _ = require('lodash')
var IS_BROWSER = require('../../env').IS_BROWSER
var Main = require('./main.jsx')
var Nav = require('./nav.jsx')
var React = require('react')

if (IS_BROWSER) require('../less/index.less')

module.exports = React.createClass({

    displayName: 'Controller',
    childContextTypes: {
        onChange: React.PropTypes.func.isRequired,
        slug: React.PropTypes.string,
    },

    _updateOffsets: function () {
        this._offsets = _.chain(this.refs.main.refs)
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
        var url = null
        if (slug.indexOf('?') === -1) {
            url = slug ? ['#', slug].join('') : ' '
        } else {
            url = slug
        }
        if (ignoreHistory !== true) {
            window.history.replaceState(undefined, undefined, url)
        }
    },

    componentDidMount: function () {
        if (!IS_BROWSER) return
        this._updateOffsets()
        this._updateHash(true)
        window.addEventListener('scroll', _.debounce(this._updateHash, 20))
        window.addEventListener('resize', this.resizeHandler)
    },

    componentWillMount: function () {
        this.setState({
            slug: window.location.search + window.location.hash,
        })
    },

    componentWillUnmount: function () {
        if (!IS_BROWSER) return
        window.removeEventListener('scroll')
        window.removeEventListener('resize')
    },

    getChildContext: function () {
        return {
            onChange: this.resizeHandler,
            slug: this.state.slug,
        }
    },

    getInitialState: function () {
        return {
            hash: undefined,
        }
    },

    render: function () {
        return (
            <div className="container">
                <Nav
                    {...this.props}
                    {...this.state}
                    ref="nav"
                />
                <Main
                    {...this.props}
                    ref="main"
                />
            </div>
        )
    },

    resizeHandler: function () {
        this._updateOffsets()
        this._updateHash()
    },

})
