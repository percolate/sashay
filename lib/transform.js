var _ = require('lodash')
var constants = require('./constants')
var slug = require('slug')

var VERBS = constants.verbs.id

module.exports = function (options) {
    return _.chain(options.schema)
        .pick('basePath', 'host', 'info', 'schemes')
        .extend({
            groups: _.chain(options.schema.paths)
                .map(function (pathItem, path) {
                    return _.chain(pathItem)
                        .map(function (operation, verb) {
                            if (!_.includes(VERBS, verb)) return false
                            return _.extend(operation, {
                                slug: slug(operation.summary),
                                path: path,
                                verb: verb,
                            })
                        })
                    .compact()
                    .value()
                })
                .flatten()
                .groupBy(function (operation) {
                    return _.first(operation.tags)
                })
                .map(function (operations, tagName) {
                    var tag = _.findWhere(options.schema.tags, { name: tagName })
                    return _.extend(tag, {
                        operations: operations,
                    })
                })
                .value(),
        })
        .value()
}
