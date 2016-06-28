var _ = require('lodash')
var Primitive = require('./primitive.jsx')
var React = require('react')

module.exports = React.createClass({
    displayName: 'Types',

    propTypes: {
        types: React.PropTypes.shape({
            array: React.PropTypes.array,
            boolean: React.PropTypes.array,
            integer: React.PropTypes.array,
            null: React.PropTypes.array,
            number: React.PropTypes.array,
            object: React.PropTypes.array,
            string: React.PropTypes.array,
        }).isRequired,
        onSelect: React.PropTypes.func,
        selectedType: React.PropTypes.oneOf([
            'array',
            'boolean',
            'integer',
            'null',
            'number',
            'object',
            'string',
            false,
            undefined,
            null,
        ]),
        onViewObject: React.PropTypes.func,
    },

    getInitialState: function () {
        var firstType = _.first(_.keys(this.props.types))

        return {
            selectedType: this.props.selectedType || firstType,
            indexesByType: this.initializeIndices(),
        }
    },

    componentWillReceiveProps: function (nextProps) {
        var overflow = _.chain(nextProps.types)
            .map(function (type, key) {
                return this.state.indexesByType[key] >= type.length
            }.bind(this))
            .includes(true)
            .value()

        if (overflow) {
            this.setState({
                indexesByType: this.initializeIndices(),
            })
        }
    },

    getTypes: function () {
        return _.keys(this.props.types)
    },

    initializeIndices: function () {
        return {
            array: 0,
            boolean: 0,
            integer: 0,
            null: 0,
            number: 0,
            object: 0,
            string: 0,
        }
    },

    render: function () {
        var types = this.getTypes()
        var currIndex = types.indexOf(this.state.selectedType)
        var selectedType = this.state.selectedType
        var viewObjectHandler = this.props.onViewObject ? this.viewObjectHandler : undefined

        return (
            <div className="types">
                {this.renderTypes(types, currIndex, this.typeClickHandler)}
                {this.renderSubTypes()}
                <Primitive
                    definition={this.props.types[selectedType][this.state.indexesByType[selectedType]]}
                    type={this.state.selectedType}
                    onViewObject={viewObjectHandler}
                />
            </div>
        )
    },

    renderTypes: function (types, currIndex, onClick) {
        return (
            <ul className="type-list">
                {_.map(types, function (type, index) {
                    var selectedClass = index === currIndex ? 'selected' : 'selectable'
                    return (
                        <li key={index} className={`type-list-item ${selectedClass}`}>
                            <a href="javascript:void(0)" onClick={onClick.bind(this, index)}>{type}</a>
                        </li>
                    )
                }.bind(this))}
            </ul>
        )
    },

    renderSubTypes: function () {
        var subTypes = this.props.types[this.state.selectedType]
        if (subTypes.length === 1 || this.props.onViewObject && this.state.selectedType === 'object') return undefined

        var titles = _.map(subTypes, 'title')
        var currIndex = this.state.indexesByType[this.state.selectedType]
        return (
            <div className="sub-types">
                {this.renderTypes(titles, currIndex, this.subTypeClickhandler)}
            </div>
        )
    },

    typeClickHandler: function (index) {
        var nextType = this.getTypes()[index]
        if (nextType === this.state.selectedType) return
        this.setState({
            selectedType: nextType,
        }, this.selectHandler)
    },

    subTypeClickhandler: function (index) {
        var currIndex = this.state.indexesByType[this.state.selectedType]
        if (currIndex === index) return
        this.setState({
            indexesByType: _.extend({}, this.state.indexesByType, {
                [this.state.selectedType]: index,
            }),
        }, this.selectHandler)
    },

    selectHandler: function () {
        if (!_.isFunction(this.props.onSelect)) return

        var selectedType = this.state.selectedType
        var selectedIndex = this.state.indexesByType[selectedType]
        this.props.onSelect(this.props.types[selectedType][selectedIndex], this.state.selectedType, selectedIndex)
    },

    viewObjectHandler: function () {
        if (!this.props.onViewObject) return

        this.props.onViewObject(_.pick(this.props.types, this.state.selectedType))
    },

})
