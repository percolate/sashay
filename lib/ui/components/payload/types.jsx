var _ = require('lodash')
var PureRenderMixin = require('react-addons-pure-render-mixin')
var React = require('react')

module.exports = React.createClass({
    mixins: [
        PureRenderMixin,
    ],

    displayName: 'Types',
    propTypes: {
        types: React.PropTypes.arrayOf(React.PropTypes.string),
        isStacked: React.PropTypes.bool,
        isSubTypes: React.PropTypes.bool,
        currType: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number,
        ]),
        onClick: React.PropTypes.func,
    },

    render: function () {
        if (_.isEmpty(this.props.types)) return null

        var classNames = ['types']
        if (this.props.isSubTypes) {
            classNames.push('sub')
        } else {
            classNames.push('primitive')
        }

        if (this.props.isStacked) {
            classNames.push('stacked')
        } else {
            classNames.push('inline')
        }

        return (
            <ul className={classNames.join(' ')}>
                {_.map(this.props.types, function (type, index) {
                    return (
                        <li key={index} className={`type-list-item ${this.getSelectedClass(type, index)}`}>
                            <a href="#" onClick={this.clickHandler.bind(this, type, index)}>{type}</a>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    getSelectedClass: function (type, index) {
        if (this.props.currType === index || this.props.currType === type || type === 'null') {
            return 'selected'
        } else {
            return 'selectable'
        }
    },

    clickHandler: function (type, index, e) {
        e.preventDefault()
        if (type === this.props.currType
            || index === this.props.currType
            || type === 'null'
            || !_.isFunction(this.props.onClick)) return

        var typeOrIndex = _.isString(this.props.currType) ? type : index
        this.props.onClick(typeOrIndex)
    },
})
