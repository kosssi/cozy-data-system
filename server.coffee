application = module.exports = (callback) ->

    americano = require 'americano'
    initialize = require './server/initialize'
    errorMiddleware = require './server/middlewares/errors'
    urlHelper = require 'cozy-url-sdk'

    # Initialize database
    # * Create cozy database if not exists
    # * Add admin database if not exists
    # * Initialize request view (_design documents)
    # * Initialize application accesses
    db = require './server/lib/db'
    db ->
        options =
            name: 'data-system'
            port: process.env.PORT or urlHelper.dataSystem.port()
            host: process.env.HOST or urlHelper.dataSystem.host()
            root: __dirname

        # Start data-system server
        americano.start options, (err, app, server) ->
            app.use errorMiddleware
            # Clean lost binaries
            initialize app, server, callback

if not module.parent
    application()
