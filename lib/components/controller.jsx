/* eslint no-process-env:0 */
var _ = require('lodash')
var Main = require('./main.jsx')
var Nav = require('./nav.jsx')
var React = require('react')

var IS_BROWSER = process.env.PLATFORM === 'browser'

if (IS_BROWSER) require('../less/index.less')

module.exports = React.createClass({

    displayName: 'Controller',

    _updateOffsets: function () {
        var main = this.refs.main.getDOMNode()
        this._offsets = _.chain(this.refs.main.refs)
            .map(function (ref, slug) {
                if (slug === 'main') return undefined
                return {
                    top: ref.getDOMNode().getBoundingClientRect().top + main.scrollTop,
                    slug: slug,
                }
            })
            .compact()
            .sortBy(function (n) {
                return n.offset
            })
            .value()
    },

    _updateHash: function () {
        var main = this.refs.main.getDOMNode()
        var offset = _.findLast(this._offsets, function (_offset) {
            return (main.scrollTop + 100) > _offset.top
        })
        var slug = offset ? offset.slug : undefined
        if (slug === this.state.hash) return
        if (slug) this.refs.nav.refs[slug].getDOMNode().scrollIntoView(false)
        this.setState({ hash: slug })
        var replaceState = slug ? ['#', slug].join('') : ' '
        window.history.replaceState(undefined, undefined, replaceState)
    },

    componentDidMount: function () {
        if (!IS_BROWSER) return
        this._updateOffsets()
        this._updateHash(window.document)
        this.refs.main.getDOMNode().addEventListener('scroll', _.debounce(_.bind(this._updateHash, this), 20))
    },

    componentWillUnmount: function () {
        if (!IS_BROWSER) return
        window.removeEventListener('scroll')
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

})
