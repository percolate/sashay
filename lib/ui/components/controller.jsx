/* eslint no-process-env:0 */
var _ = require('lodash')
var Main = require('./main.jsx')
var Nav = require('./nav.jsx')
var React = require('react')
var ReactDom = require('react-dom')

var IS_BROWSER = process.env.PLATFORM === 'browser'

if (IS_BROWSER) {
    require('../less/index.less')
    require('../less/prism.less')
}

module.exports = React.createClass({

    displayName: 'Controller',

    _updateOffsets: function () {
        var main = ReactDom.findDOMNode(this.refs.main)
        this._offsets = _.chain(this.refs.main.refs)
            .map(function (ref, slug) {
                if (slug === 'main') return undefined
                return {
                    top: ref.getBoundingClientRect().top + main.scrollTop,
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
        var main = ReactDom.findDOMNode(this.refs.main)
        var offset = _.findLast(this._offsets, function (_offset) {
            return (main.scrollTop + 100) > _offset.top
        })
        var slug = offset ? offset.slug : undefined
        if (slug === this.state.hash) return
        if (slug) this.refs.nav.refs[slug].scrollIntoView(false)
        this.setState({ hash: slug })
        var url = slug ? ['#', slug].join('') : ' '
        window.history.replaceState(undefined, undefined, url)
    },

    componentDidMount: function () {
        if (!IS_BROWSER) return
        this._updateOffsets()
        this._updateHash()
        ReactDom.findDOMNode(this.refs.main).addEventListener('scroll', _.debounce(_.bind(this._updateHash, this), 20))
    },

    componentWillUnmount: function () {
        if (!IS_BROWSER) return
        ReactDom.findDOMNode(this.refs.main).removeEventListener('scroll')
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
