var fs = require('fs-extra')
var Handlebars = require('handlebars')
var Joi = require('joi')
var normalize = require('./normalize')
var path = require('path')
var preprocess = require('./preprocessor').preprocess

var OPTIONS_SCHEMA = Joi.object().keys({
    destination: Joi.string(),
    filename: Joi.string().default('reference.md'),
    filter: Joi.array().items(Joi.string()),
    input: Joi.object().required(),
    template: Joi.string().default(path.resolve(__dirname, './templates/markdown.hbs')),
}).required()

exports.template = template

function template (options) {
    var validation = Joi.validate(options, OPTIONS_SCHEMA)
    if (validation.error) throw new Error(validation.error)
    options = normalize(validation.value, [
        'destination',
        'template',
    ])
    return preprocess(options)
        .then(function (data) {
            var render = Handlebars.compile(fs.readFileSync(options.template, 'utf8'))
            var output = render(data).replace(/(\n){2,}/g, '\n\n')
            if (!options.destination) return output
            fs.ensureDirSync(options.destination)
            fs.writeFileSync(path.resolve(options.destination, './', options.filename), output)
            return ''
        })
}
