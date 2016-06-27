var _ = require('lodash')
var Code = require('../code.jsx')
var Markdown = require('../markdown.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

var METADATA = {
    string: ['enum', 'pattern'],
}

module.exports = React.createClass({
    displayName: 'Primitive',

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        definition: React.PropTypes.shape({
            description: React.PropTypes.array,
        }).isRequired,
        type: React.PropTypes.oneOf([
            'array',
            'boolean',
            'integer',
            'null',
            'number',
            'object',
            'string',
        ]).isRequired,
        onViewObject: React.PropTypes.func,
    },

    render: function () {
        var { description } = this.props.definition
        var metadata
        if (this.props.type === 'object' && this.props.onViewObject) {
            metadata = <a href="javascript:void(0)" className="view-object-link" onClick={this.viewObjectHandler}>View object details</a>
        } else {
            metadata = this.renderMetadata()
        }
        return (
            <div className="primitive">
                {_.map(description, this.renderContent)}
                {metadata}
            </div>
        )
    },

    renderContent: function (content, index) {
        return (content.type === 'code') ? <Code key={index} lang={content.lang} code={content.text} /> : <Markdown key={index} content={content.text} />
    },

    getMetadata: function () {
        var attrs = METADATA[this.props.type]
        if (!attrs) return undefined

        return _.chain(this.props.definition)
            .pick(attrs)
            .map(function (value, label) {
                if (_.isEmpty(value)) return undefined
                return [label, value]
            })
            .compact()
            .fromPairs()
            .value()
    },

    renderMetadata: function () {
        var metadata = this.getMetadata()
        if (_.isEmpty(metadata)) return undefined

        return (
            <ul className="metadata-list">
                {_.map(metadata, function (value, label) {
                    return (
                        <li
                            key={label}
                            className="metadata-list-item"
                        >
                            <div className="metadata-label">{label}:</div>
                            <div className="metadata-value">{this.renderMetadataValue(value)}</div>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    renderMetadataValue: function (values) {
        if (_.isArray(values)) {
            return (
                <ul>
                    {_.map(values, function (value, index) {
                        return (
                            <li key={index}>
                                <code className="inline">{value}</code>
                            </li>
                        )
                    })}
                </ul>
            )
        } else {
            return <code className="inline">{values}</code>
        }
    },

    viewObjectHandler: function () {
        this.props.onViewObject()
    },

})
