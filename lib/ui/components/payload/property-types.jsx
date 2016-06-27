var _ = require('lodash')
var React = require('react')
var Types = require('./types.jsx')

module.exports = React.createClass({
    displayName: 'PropertyTypes',

    propTypes: {
        types: React.PropTypes.object.isRequired,
        onViewObject: React.PropTypes.func,
    },

    getInitialState: function () {
        return {
            arrayTypes: _.get(this.props, ['types', 'array', 0, 'types']),
        }
    },

    render: function () {
        // automatically select array on initialize render
        var selectedType
        if (this.state.arrayTypes) {
            selectedType = 'array'
        }

        return (
            <div>
                <Types
                    types={this.props.types}
                    onSelect={this.typeSelectHandler}
                    selectedType={selectedType}
                    onViewObject={this.props.onViewObject}
                />
                {this.renderArrayTypes()}
            </div>
        )
    },

    renderArrayTypes: function () {
        if (!this.state.arrayTypes) return undefined

        return (
            <div className="array-types">
                <div className="array-types-title">Array items:</div>
                <Types types={this.state.arrayTypes} onViewObject={this.props.onViewObject} />
            </div>
        )
    },

    typeSelectHandler: function (definition, type) {
        if (type === 'array' && this.state.arrayTypes) return

        this.setState({
            arrayTypes: type === 'array' ? definition.types : false,
        })
    },

})
