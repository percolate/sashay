var _ = require('lodash')
var slug = require('slug')

module.exports = function (options) {
    return _.chain(options.schema)
        .pick('basePath', 'host', 'info', 'schemes')
        .extend({
            groups: _.chain(options.schema.paths)
                .map(function (pathItem, path) {
                    return _.map(pathItem, function (operation, verb) {
                        return _.extend(operation, {
                            slug: slug(operation.summary),
                            path: path,
                            verb: verb,
                        })
                    })
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
