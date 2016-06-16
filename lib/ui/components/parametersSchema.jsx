var _ = require('lodash')
var Select = require('./dropdown.jsx')
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
            objectDescription: React.PropTypes.string.isRequired,
            isExpandable: React.PropTypes.bool.isRequired,
            properties: React.PropTypes.object,
            oneOf: React.PropTypes.arrayOf(React.PropTypes.shape({
                displayName: React.PropTypes.string.isRequired,
                objectDescription: React.PropTypes.string.isRequired,
                properties: React.PropTypes.object,
            })),
        }),
        onChange: React.PropTypes.func.isRequired,
    },

    getInitialState: function () {
        var objects = {}
        objects[ROOT] = this.props.schema.properties
        var oneOfs = {}
        oneOfs[ROOT] = 0
        return {
            breadcrumbs: this.props.schema.isExpandable || this.props.schema.oneOf ? [ROOT] : null,
            objects: objects,
            oneOfs: oneOfs,
            selected: ROOT,
        }
    },

    displayNestedObject: function (object) {
        var displayName = (object.displayName !== ROOT && object.type.match(/.*\[\]/)) ? object.displayName + '[]' : object.displayName
        var index = _.indexOf(this.state.breadcrumbs, displayName)
        if (index === -1) {
            var objects = this.state.objects
            objects[displayName] = object
            this.state.breadcrumbs.push(displayName)
            var oneOfs = this.state.oneOfs
            oneOfs[displayName] = 0
            this.setState({
                breadcrumbs: this.state.breadcrumbs,
                objects: objects,
                oneOfs: oneOfs,
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

    createBreadCrumbs: function (parameters) {
        return _.map(this.state.breadcrumbs, function (breadcrumb, i) {
            var separator = i < this.state.breadcrumbs.length - 1 ? (<span className="separator">{'.'}</span>) : (<span/>)
            var parameterObject = breadcrumb === ROOT ? {
                displayName: ROOT,
                properties: parameters,
            } : this.state.objects[breadcrumb]
            var el = breadcrumb !== this.state.selected ? <a onClick={this.displayNestedObject.bind(null, parameterObject)}>
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

    prepareRender: function () {
        var object = this.state.selected !== ROOT ? this.state.objects[this.state.selected] : this.props.schema
        var parametersObject = _.chain({})
            .extend(_.has(object, 'items') ? object.items.properties : object.properties)
            .value()
        var oneOfs = _.has(object, ['items', 'oneOf']) ? object.items.oneOf : _.get(object, 'oneOf')
        var oneOfProperty = _.get(oneOfs, this.state.oneOfs[this.state.selected])
        _.map(oneOfProperty ? oneOfProperty.properties : [], function (property) {
            parametersObject[property.displayName] = property
        })
        var description = _.trim(_.get(parametersObject, 'objectDescription', '') + ' ' + (oneOfProperty ? oneOfProperty.objectDescription : ''))
        _.map(oneOfProperty ? oneOfProperty.properties : [], function (property) {
            parametersObject[property.displayName] = _.chain({})
                .extend(parametersObject[property.displayName])
                .merge(property)
                .value()
        })
        return {
            description: description,
            oneOfs: oneOfs,
            oneOfProperty: oneOfProperty,
            parametersObject: parametersObject,
        }
    },

    render: function () {
        var data = this.prepareRender()
        var breadcrumbs = this.createBreadCrumbs(data.parameters)
        return (
            <div>
                <div className="sub-menu">
                    <div ref="breadcrumbs" className="breadcrumbs">{breadcrumbs}</div>
                    {!_.isEmpty(data.oneOfs) && <div className="group">
                        <label>Types:</label>
                        <span className="reactDropdown-wrapper">
                            <Select options={this.mapOneOfs(data.oneOfs)} label={this.mapOneOfs(data.oneOfs)[this.state.oneOfs[this.state.selected]].label} onClick={this.showOneOf}/>
                        </span>
                    </div>}
                    {!_.isEmpty(data.description) && <Markdown content={data.description}/>}
                </div>
                <Parameters parameters={data.parametersObject} onClick={this.displayNestedObject}/>
            </div>
        )
    },

})
