var builder = require('./builder')
var preprocessor = require('./preprocessor')
var templater = require('./templater')

exports.build = builder.build
exports.preprocess = preprocessor.preprocess
exports.template = templater.template
