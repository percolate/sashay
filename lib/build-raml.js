var _ = require('lodash')
var BPromise = require('bluebird')
var dereference = require('./expand').dereference
var fs = require('fs-extra')
var getFiles = require('./expand').getFiles
var path = require('path')
var writeTemp = require('./expand').writeTemp

module.exports = function (options) {
    fs.copySync(path.dirname(options.temp), options.destination)
    return BPromise.resolve()
        .then(getFiles.bind(undefined, {
            source: path.resolve(options.destination, './index.raml'),
        }))
        .then(dereference)
        .then(writeTemp)
        .then(cleanupSource)
}

function cleanupSource (schemaMap) {
    _.forEach(schemaMap, function (val, sourcePath) {
        fs.unlinkSync(sourcePath)
    })
}
