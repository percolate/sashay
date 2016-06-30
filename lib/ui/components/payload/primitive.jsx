var _ = require('lodash')
var Code = require('../code.jsx')
var Markdown = require('../markdown.jsx')
var Metadata = require('./metadata.jsx')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Primitive',

    mixins: [
        PureRenderMixin,
    ],

    propTypes: {
        description: React.PropTypes.array,
        metadata: React.PropTypes.object,
        type: React.PropTypes.oneOf([
            'array',
            'boolean',
            'integer',
            'null',
            'number',
            'object',
            'string',
        ]).isRequired,
    },

    render: function () {
        var metadata = this.renderMetadata()
        var description = this.renderDescription()

        if (!metadata && !description) return null

        return (
            <div className="primitive">
                {description}
                {metadata}
            </div>
        )
    },

    renderDescription: function () {
        var description = this.props.description
        if (_.isEmpty(description)) return null

        return _.map(description, function (content, index) {
            if (content.type === 'code') {
                return <Code key={index} lang={content.lang} code={content.text} />
            } else {
                return <Markdown key={index} content={content.text} />
            }
        })
    },

    renderMetadata: function () {
        if (_.isEmpty(this.props.metadata)) return null
        return <Metadata metadata={this.props.metadata} />
    },

})
