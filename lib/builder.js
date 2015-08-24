var _ = require('lodash')
var BPromise = require('bluebird')
var fs = require('fs-extra')
var Handlebars = require('handlebars')
var Hapi = require('hapi')
var Inert = require('inert')
var Joi = require('joi')
var normalize = require('./normalize')
var path = require('path')
var preprocess = require('./preprocessor').preprocess
var url = require('url')
var util = require('util')
var Watchpack = require('watchpack')
var WebpackDevServer = require('webpack-dev-server')
var webpack = require('webpack')
var webpackConfigDev = require('../webpack.config.dev')
var webpackConfigProd = require('../webpack.config.prod')

var OPTIONS_SCHEMA = Joi.object().keys({
    destination: Joi.string().default('./build/'),
    dev: Joi.any().when('preview', {
        is: true,
        then: Joi.forbidden(),
        otherwise: Joi.boolean(),
    }).default(false),
    filename: Joi.string().default('index.html'),
    filter: Joi.array().items(Joi.string()),
    input: Joi.object().required(),
    preview: Joi.boolean().default(false),
}).required()
var CSS_PATH = '/app.css'
var JS_PATH = '/app.js'
var PROTOCOL = 'http'
var HOSTNAME = '127.0.0.1'
var STATIC_SERVER_PORT = 8000
var WEBPACK_SERVER_PORT = 8001
var LAYOUT_PATH = path.resolve(__dirname, './templates/layout.hbs')
var JS_URI = url.format({
    hostname: HOSTNAME,
    pathname: JS_PATH,
    port: WEBPACK_SERVER_PORT,
    protocol: PROTOCOL,
})
var STATIC_SERVER_ORIGIN = url.format({
    hostname: HOSTNAME,
    port: STATIC_SERVER_PORT,
    protocol: PROTOCOL,
})
var SERVER_MESSAGE_TEMPLATE = 'Server listening at %s'

exports.build = build

function build (options) {
    var validation = Joi.validate(options, OPTIONS_SCHEMA)
    if (validation.error) throw new Error(validation.error)
    options = normalize(validation.value, [
        'destination',
    ])
    return preprocess(options)
        .then(function (data) {
            options.input = data
            if (options.dev) {
                return BPromise.resolve()
                    .then(buildLayout.bind(undefined, options))
                    .then(watchLayout.bind(undefined, options))
                    .then(function () {
                        return BPromise.all([
                            startStaticServer(options),
                            startWebpackServer(options),
                        ])
                    })
            }
            return BPromise.resolve()
                .then(function () {
                    return BPromise.all([
                        buildLayout(options),
                        buildApp(options),
                    ])
                })
                .then(function () {
                    if (!options.preview) return undefined
                    return startStaticServer(options)
                })
        })
}

function buildApp (options) {
    return new BPromise(function (resolve, reject) {
        var compiler = getCompiler(options)
        compiler.run(function (err, stats) {
            if (err) return reject(err)
            if (stats.hasErrors()) return reject(stats.toJson().errors)
            return resolve()
        })
    })
}

function buildLayout (options) {
    var cssPath
    var jsPath
    var markup
    if (options.dev) {
        jsPath = JS_URI
    } else {
        cssPath = CSS_PATH
        jsPath = JS_PATH
        markup = getMarkup(options)
    }
    var render = Handlebars.compile(fs.readFileSync(LAYOUT_PATH, 'utf8'))
    var html = render({
        css: cssPath,
        data: JSON.stringify(options.input),
        js: jsPath,
        markup: markup,
        title: options.input.info.title,
    })
    fs.ensureDirSync(options.destination)
    fs.emptyDirSync(options.destination)
    fs.writeFileSync(path.resolve(options.destination, './', options.filename), html)
    return BPromise.resolve()
}

function getCompiler (options) {
    var config = (options.dev) ? webpackConfigDev : webpackConfigProd
    return webpack(_.merge(config, {
        output: {
            path: options.destination,
        },
    }))
}

function getMarkup (options) {
    require('babel/register')({
        extensions: [
            '.jsx',
        ],
    })
    var Controller = require('./components/controller.jsx')
    var React = require('react')
    return React.renderToStaticMarkup(React.createElement(Controller, options.input))
}

function startStaticServer (options) {
    var server = new Hapi.Server()
    server.connection({
        port: STATIC_SERVER_PORT,
    })
    return new BPromise(function (resolve, reject) {
        server.register(Inert, function () {
            server.route({
                method: 'GET',
                path: '/{param*}',
                handler: {
                    directory: {
                        path: options.destination,
                    },
                },
            })
            server.start(function (err) {
                if (err) return reject(err)
                console.log(util.format(SERVER_MESSAGE_TEMPLATE, STATIC_SERVER_ORIGIN))
                return resolve()
            })
        })
    })
}

function startWebpackServer (options) {
    return new BPromise(function (resolve, reject) {
        var compiler = getCompiler(options)
        var server = new WebpackDevServer(compiler)
        server.listen(WEBPACK_SERVER_PORT, function (err) {
            if (err) return reject(err)
            return resolve()
        })
    })
}

function watchLayout (options) {
    var watchpack = new Watchpack()
    var files = [
        path.resolve(__dirname, './entry'),
    ]
    var dirs = [
        path.resolve(__dirname, './components/'),
        path.resolve(__dirname, './templates/'),
    ]
    watchpack.on('aggregated', function () {
        buildLayout(options)
    })
    watchpack.watch(files, dirs)
}
