var raml = require('../raml')

exports.emptyScalar = function(type, subTypeNumber) {
    var formatted = { description: undefined, example: undefined }

    if (subTypeNumber) {
        formatted.title = `Subtype ${subTypeNumber}`
    }

    return [formatted]
}

exports.buildJSON = function(options) {
    return raml.normalize(options).then(raml.buildJSON.bind(undefined, options))
}

exports.buildRAML = function(options) {
    return raml.normalize(options).then(raml.buildRAML.bind(undefined, options))
}
