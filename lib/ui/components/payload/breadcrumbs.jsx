var classNames = require('classnames')
var createClass = require('react').createClass
var fromJS = require('immutable').fromJS
var List = require('immutable').List
var noop = require('lodash/noop')
var PropTypes = require('react').PropTypes
var PureRenderMixin = require('react-addons-pure-render-mixin')

module.exports = createClass({
    displayName: 'Breadcrumbs',
    mixins: [PureRenderMixin],
    propTypes: {
        onClick: PropTypes.func,
        pathKeys: PropTypes.instanceOf(List).isRequired,
    },

    getDefaultProps: function () {
        return {
            onClick: noop,
        }
    },

    render: function () {
        return (
            <ul className="breadcrumbs">
                {this.props.pathKeys
                    .unshift(fromJS({
                        key: 'root',
                        schemaKeyPath: [],
                    }))
                    .map(function (pathKey, i, list) {
                        var isLast = (pathKey === list.last())
                        var name = [
                            pathKey.get('key'),
                            (pathKey.get('type') === 'array') ? '[ ]' : undefined,
                        ].join(' ')
                        return (
                            <li
                                className={classNames({ active: isLast })}
                                key={pathKey.get('key')}
                            >
                                <a
                                    href="javascript:void(0)"
                                    onClick={(!isLast)
                                        ? this.props.onClick.bind(undefined, pathKey.get('schemaKeyPath').toJS())
                                        : noop
                                    }
                                >{name}</a>
                            </li>
                        )
                    }.bind(this))
                    .valueSeq()
                }
            </ul>
        )
    },
})
