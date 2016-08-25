var _ = require('lodash')
var BPromise = require('bluebird')
var buildRAML = require('./expand').buildRAML
var expand = require('./expand')
var fs = require('fs-extra')
var Joi = require('joi')
var Handlebars = require('handlebars')
var path = require('path')
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
var OPTIONS_SCHEMA = Joi.object().keys({
    destination: Joi.string().default(path.resolve(process.cwd(), './build/')),
    publicOnly: Joi.boolean().default(false),
    output: Joi.string().valid(_.map(FORMATS, 'id')).default(FORMATS.json.id),
    quiet: Joi.boolean().default(false),
    source: Joi.string().required(),
    watch: Joi.boolean().default(false),
    tmpDir: Joi.string().default(undefined),
}).required()
var CSS_PATH = 'app.css'
var JS_PATH = 'app.js'
var LAYOUT_PATH = path.resolve(__dirname, './templates/layout.hbs')
var PROTOCOL = 'http'
var HOSTNAME = '127.0.0.1'
var WEBPACK_SERVER_PORT = 8000
var JS_URI = url.format({
    hostname: HOSTNAME,
    pathname: JS_PATH,
    port: WEBPACK_SERVER_PORT,
    protocol: PROTOCOL,
})

module.exports = function (options) {
    return BPromise.resolve().then(function () {
        options = normalizeOptions(options)
        var build = getBuildFn(options)
        var isWeb = options.output === FORMATS.web.id
        if (options.watch) {
            return BPromise.all([
                watch(build, options),
                isWeb ? startWebpackServer(options) : undefined,
            ])
            .then(getStopAllFn)
        } else {
            return build()
        }
    })
}

function buildJSON (options) {
    return BPromise.resolve()
        .then(function () {
            var dest = path.resolve(options.destination, './schema.json')
            if (!options.quiet) console.log(util.format('Building to %s', dest))
            fs.writeFileSync(dest, JSON.stringify(options.schema, undefined, 2))
        })
}

function buildHTML (options) {
    return BPromise.resolve()
        .then(function () {
            var cssPath
            var jsPath
            var markup
            if (options.watch) {
                jsPath = JS_URI
            } else {
                cssPath = CSS_PATH
                jsPath = JS_PATH
                markup = getHTML(options)
            }
            var render = Handlebars.compile(fs.readFileSync(LAYOUT_PATH, 'utf8'))
            var html = render({
                css: cssPath,
                data: JSON.stringify(options.data),
                js: jsPath,
                html: markup,
                title: _.get(options, [
                    'data',
                    'title',
                ]),
            })
            var destination = path.resolve(options.destination, './index.html')
            if (!options.quiet) console.log(`Building to ${destination}`)
            fs.writeFileSync(destination, html)
        })
}

function buildWebpack (options) {
    return new BPromise(function (resolve, reject) {
        var compiler = getCompiler(options)
        compiler.run(function (err, stats) {
            if (err) return reject(err)
            if (stats.hasErrors()) return reject(stats.toJson().errors)
            return resolve()
        })
    })
}

function getBuildFn (options) {
    return function () {
        return prepDestination(options)
            .then(function () {
                if (options.output === FORMATS.raml.id) return buildRAML(options)
                return expand(options)
                    .then(function (schema) {
                        _.extend(options, { schema: schema })
                        if (options.output === FORMATS.json.id) return buildJSON(options)
                        _.extend(options, { data: transform(options) })
                        return BPromise.all([
                            buildHTML(options),
                            (!options.watch) ? buildRAML(options) : BPromise.resolve(),
                            (!options.watch) ? buildWebpack(options) : BPromise.resolve(),
                        ])
                    })
            })
    }
}

function getCompiler (options) {
    var config = (options.watch) ? webpackConfigDev : webpackConfigProd
    return webpack(_.merge(config, {
        output: {
            path: options.destination,
        },
    }))
}

function getHTML (options) {
    require('babel-register')({
        extensions: [
            '.jsx',
        ],
        // needed when running sashay from another folder
        only: './ui',
        presets: [
            'react',
            'es2015',
        ],
    })
    var React = require('react')
    var Controller = require('../ui/components/controller.jsx')
    var ReactDOMServer = require('react-dom/server')
    return ReactDOMServer.renderToStaticMarkup(React.createElement(Controller, options.data))
}

function getStopAllFn (servers) {
    return function () {
        _.forEach(servers, function (server) {
            if (!server) return

            var stop = server.stop || server.close
            if (stop) stop.call(server, _.noop)
        })
    }
}

function normalizeOptions (options) {
    var validation = Joi.validate(options, OPTIONS_SCHEMA)
    if (validation.error) throw new Error(validation.error)
    return validation.value
}

function prepDestination (options) {
    return BPromise.resolve().then(function () {
        fs.ensureDirSync(options.destination)
        fs.emptyDirSync(options.destination)
    })
}

function startWebpackServer (options) {
    return new BPromise(function (resolve, reject) {
        var compiler = getCompiler(options)
        var server = new WebpackDevServer(compiler, {
            contentBase: options.destination,
            historyApiFallback: true,
            quiet: options.quiet,
        })
        server.listen(WEBPACK_SERVER_PORT, function (err) {
            if (err) return reject(err)
            return resolve(server)
        })
    })
}

function watch (fn, options) {
    var watchpack = new Watchpack()
    var dirs = [
        path.dirname(options.source),
    ]
    return fn().then(function () {
        watchpack.on('change', function (filePath) {
            console.log(`detected change: ${filePath}`)
        })
        watchpack.on('aggregated', fn)
        watchpack.watch([`${path.resolve(__dirname)}/*.js`], dirs)
        return watchpack
    })
}
