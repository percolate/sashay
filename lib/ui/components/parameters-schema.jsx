var _ = require('lodash')
var Markdown = require('./markdown.jsx')
var Parameters = require('./parameters.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')
var ReactDOM = require('react-dom')

var ROOT = 'root'
module.exports = React.createClass({
    expanded: false,
    displayName: 'Parameters',
    mixins: [
        PureRenderMixin,
    ],
    propTypes: {
        schema: React.PropTypes.shape({
        }),
        onChange: React.PropTypes.func.isRequired,
    },

    getInitialState: function () {
        var objects = {}
        objects[ROOT] = this.props.schema
        var oneOfs = {}
        oneOfs[ROOT] = 0
        return {
            breadcrumbs: [ROOT],
            objects: objects,
            oneOfs: oneOfs,
            selected: ROOT,
        }
    },

    displayNestedObject: function (object, displayName) {
        var index = _.indexOf(this.state.breadcrumbs, displayName)
        if (index === -1) {
            var objects = this.state.objects
            objects[displayName] = object
            this.state.breadcrumbs.push(displayName)
            this.setState({
                breadcrumbs: this.state.breadcrumbs,
                objects: objects,
            })
        } else {
            this.setState({
                breadcrumbs: _.dropRight(this.state.breadcrumbs, this.state.breadcrumbs.length - index - 1),
            })
        }
        this.setState({
            selected: displayName,
        })
        this.expanded = true
    },

    componentDidUpdate: function () {
        if (!this.isBreadCrumbsVisible() && this.expanded) {
            this.refs.breadcrumbs.scrollIntoView()
        }
        if (this.props.onChange && this.expanded) {
            this.props.onChange()
        }
        this.expanded = false
    },

    isBreadCrumbsVisible: function () {
        var el = ReactDOM.findDOMNode(this.refs.breadcrumbs)
        var rect = el.getBoundingClientRect()
        var containmentRect = {
            top: 0,
            left: 0,
            bottom: window.innerHeight || document.documentElement.clientHeight,
            right: window.innerWidth || document.documentElement.clientWidth,
        }

        var visibilityRect = {
            top: rect.top >= containmentRect.top,
            left: rect.left >= containmentRect.left,
            bottom: rect.bottom <= containmentRect.bottom,
            right: rect.right <= containmentRect.right,
        }

        return (
            visibilityRect.top &&
            visibilityRect.left &&
            visibilityRect.bottom &&
            visibilityRect.right
        )
    },

    createBreadCrumbs: function () {
        return _.map(this.state.breadcrumbs, function (breadcrumb, i) {
            var separator = i < this.state.breadcrumbs.length - 1 ? (<span className="separator">{'.'}</span>) : (<span/>)
            var parameterObject = breadcrumb === ROOT ? this.props.schema : this.state.objects[breadcrumb]
            var el = breadcrumb !== this.state.selected ? <a onClick={this.displayNestedObject.bind(null, parameterObject, breadcrumb)}>
                {breadcrumb}
                </a> : <a className="selected">{breadcrumb}</a>
            return (<span key={i}>{el}{separator}</span>)
        }.bind(this))
    },

    mapOneOfs: function (oneOf) {
        return _.map(oneOf, function (object, i) {
            return {
                label: object.displayName,
                value: i,
            }
        })
    },

    showOneOf: function (option) {
        var oneOfs = this.state.oneOfs
        oneOfs[this.state.selected] = option
        this.setState({
            oneOfs: _.clone(oneOfs),
        })
    },

    render: function () {
        var data = this.state.selected !== ROOT ? this.state.objects[this.state.selected] : this.props.schema
        var schema = {}
        if (data.length > 1) {
            // TODO
        } else {
            if (_.has(data, 'object')) {
                if (data.object.length > 1) {
                    // TODO
                } else {
                    schema = data.object[0]
                }
            } else if (_.has(data, 'properties')) {
                schema = data
            }
        }

        var breadcrumbs = this.createBreadCrumbs(schema)
        return (
            <div>
                <div className="sub-menu">
                    <div ref="breadcrumbs" className="breadcrumbs">{breadcrumbs}</div>

                    {!_.isEmpty(schema.description) && <Markdown content={schema.description}/>}
                </div>
                <Parameters parameters={schema.properties} onClick={this.displayNestedObject} onChange={this.props.onChange}/>
            </div>
        )
    },

})
