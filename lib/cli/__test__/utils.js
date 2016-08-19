exports.emptyScalar = function (type, subTypeNumber) {
    var formatted = { description: undefined, example: undefined }

    if (subTypeNumber) {
        formatted.title = `Subtype ${subTypeNumber}`
    }

    return [formatted]
}
