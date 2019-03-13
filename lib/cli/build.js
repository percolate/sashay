var _ = require('lodash')
var BPromise = require('bluebird')
var fs = require('fs-extra')
var Joi = require('joi')
var Handlebars = require('handlebars')
var path = require('path')
var raml = require('./raml')
var transform = require('./transform')
var url = require('url')
var util = require('util')
var Watchpack = require('watchpack')
var WebpackDevServer = require('webpack-dev-server')
var webpack = require('webpack')
var webpackConfigDev = require('./webpack.config.dev')
var webpackConfigProd = require('./webpack.config.prod')

var FORMATS = {
    json: {
        id: 'json',
    },
    raml: {
        id: 'raml',
    },
    web: {
        id: 'web',
    },
}
var OPTIONS_SCHEMA = Joi.object()
    .keys({
        destination: Joi.string().default(
            path.resolve(process.cwd(), './build/')
        ),
        publicOnly: Joi.boolean().default(false),
        output: Joi.array()
            .items(Joi.string().valid(_.map(FORMATS, 'id')))
            .min(1)
            .default([FORMATS.json.id]),
        quiet: Joi.boolean().default(false),
        source: Joi.string().required(),
        watch: Joi.boolean().default(false),
        validate: Joi.boolean().default(true),
        tmpDir: Joi.string().default(undefined),
    })
    .required()
var CSS_PATH = 'app.css'
var JS_PATH = 'app.js'
var LAYOUT_PATH = path.resolve(__dirname, './templates/layout.hbs')
var PROTOCOL = 'http'
var HOSTNAME = '127.0.0.1'
var WEBPACK_SERVER_PORT = 8080
var JS_URI = url.format({
    hostname: HOSTNAME,
    pathname: JS_PATH,
    port: WEBPACK_SERVER_PORT,
    protocol: PROTOCOL,
})

var log

module.exports = function(options) {
    log = function(msg) {
        if (!options.quiet) console.log(msg)
    }

    return BPromise.resolve().then(function() {
        options = normalizeOptions(options)
        var build = getBuildFn(options)
        var isWeb = _.includes(options.output, FORMATS.web.id)
        if (options.watch) {
            return BPromise.join(
                watch(build, options),
                isWeb ? startWebpackServer(options) : BPromise.resolve()
            ).then(getStopAllFn)
        } else {
            return build()
        }
    })
}

function buildJSON(options, schema) {
    if (!_.includes(options.output, FORMATS.json.id)) return BPromise.resolve()

    log('JSON: building...')
    return BPromise.resolve().then(function() {
        var dest = path.resolve(options.destination, './schema.json')
        return fs
            .outputFileAsync(dest, JSON.stringify(schema, undefined, 2))
            .then(function() {
                log(util.format('JSON: Built to %s', dest))
            })
    })
}

function buildRAML(options) {
    // web depends on RAML build (except in watch mode)
    if (
        !(
            _.includes(options.output, FORMATS.raml.id) ||
            (!options.watch && _.includes(options.output, FORMATS.web.id))
        )
    )
        return BPromise.resolve()

    log('RAML: building...')
    return BPromise.resolve()
        .then(function() {
            return raml.buildRAML(options)
        })
        .then(function(ramlString) {
            var destination = path.resolve(options.destination, 'index.raml')
            return fs.outputFileAsync(destination, ramlString).then(function() {
                log(`RAML: Built to ${destination}`)
            })
        })
}

function buildWeb(options, schema) {
    if (!_.includes(options.output, FORMATS.web.id)) return BPromise.resolve()

    log('HTML: building...')
    return BPromise.resolve().then(function() {
        return BPromise.join([
            buildHTML(options, schema),
            !options.watch ? buildWebpack(options) : BPromise.resolve(),
        ])
    })
}

function buildHTML(options, schema) {
    var data = transform(schema)
    return BPromise.resolve().then(function() {
        var cssPath
        var jsPath
        var markup
        if (options.watch) {
            jsPath = JS_URI
        } else {
            cssPath = CSS_PATH
            jsPath = JS_PATH
            markup = getHTML(data)
        }
        var render = Handlebars.compile(fs.readFileSync(LAYOUT_PATH, 'utf8'))
        var html = render({
            css: cssPath,
            data: JSON.stringify(data),
            js: jsPath,
            html: markup,
            title: _.get(data, ['title']),
        })
        var destination = path.resolve(options.destination, './index.html')
        return fs.outputFileAsync(destination, html).then(function() {
            log(`HTML: Built to ${destination}`)
        })
    })
}

function buildWebpack(options) {
    return new BPromise(function(resolve, reject) {
        var compiler = getCompiler(options)
        compiler.run(function(err, stats) {
            if (err) return reject(err)
            if (stats.hasErrors()) return reject(stats.toJson().errors)
            return resolve()
        })
    })
}

function getBuildFn(options) {
    return function() {
        return prepDestination(options)
            .then(function() {
                log('Normalizing source...')
                return raml.normalize(options)
            })
            .then(function() {
                log('Parsing RAML...')
                return raml.buildJSON(options)
            })
            .then(function(schema) {
                return BPromise.join(
                    buildRAML(options),
                    buildJSON(options, schema),
                    buildWeb(options, schema)
                )
            })
    }
}

function getCompiler(options) {
    var config = options.watch ? webpackConfigDev : webpackConfigProd
    return webpack(
        _.merge(config, {
            output: {
                path: options.destination,
            },
        })
    )
}

function getHTML(data) {
    require('@babel/register')({
        extensions: ['.jsx'],
        // needed when running sashay from another folder
        only: [/ui/],
        presets: ['@babel/preset-env', '@babel/preset-react'],
    })
    var React = require('react')
    var App = require('../ui/components/app.jsx')
    var ReactDOMServer = require('react-dom/server')
    return ReactDOMServer.renderToStaticMarkup(React.createElement(App, data))
}

function getStopAllFn(servers) {
    return function() {
        _.forEach(servers, function(server) {
            if (!server) return

            var stop = server.stop || server.close
            if (stop) stop.call(server, _.noop)
        })
    }
}

function normalizeOptions(options) {
    var validation = Joi.validate(options, OPTIONS_SCHEMA)
    if (validation.error) throw new Error(validation.error)
    return validation.value
}

function prepDestination(options) {
    return BPromise.resolve()
        .then(function() {
            return fs.ensureDirAsync(options.destination)
        })
        .then(function() {
            return fs.emptyDirAsync(options.destination)
        })
}

function startWebpackServer(options) {
    return new BPromise(function(resolve, reject) {
        var compiler = getCompiler(options)
        var server = new WebpackDevServer(compiler, {
            contentBase: options.destination,
            historyApiFallback: true,
            quiet: options.quiet,
        })
        server.listen(WEBPACK_SERVER_PORT, HOSTNAME, function(err) {
            if (err) return reject(err)
            return resolve(server)
        })
    })
}

function watch(fn, options) {
    var watchpack = new Watchpack()
    var dirs = [path.dirname(options.source)]
    return fn().then(function() {
        watchpack.on('change', function(filePath) {
            console.log(`detected change: ${filePath}`)
        })
        watchpack.on('aggregated', fn)
        watchpack.watch([`${path.resolve(__dirname)}/*.js`], dirs)
        return watchpack
    })
}
