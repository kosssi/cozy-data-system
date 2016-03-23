cradle = require 'cradle'
S = require 'string'
fs = require 'fs'

initLoginCouch = ->
    try
        data = fs.readFileSync '/etc/cozy/couchdb.login'
    catch err
        console.log "No CouchDB credentials file found: /etc/cozy/couchdb.login"
        process.exit 1
    lines = S(data.toString('utf8')).lines()
    return lines

setup_credentials = ->
    #default credentials
    credentials =
        host: urlHelper.couch.host()
        port: urlHelper.couch.port()
        cache: false
        raw: false
        db: urlHelper.couch.name()

    # credentials retrieved by environment variable
    if process.env.NODE_ENV is 'production'
        loginCouch = initLoginCouch()
        credentials.auth = {
            username: loginCouch[0]
            password: loginCouch[1]
        }

    return credentials

db = null #singleton connection

exports.db_connect = ->
    if not db?
        credentials = setup_credentials()
        connection = new cradle.Connection credentials
        db = connection.database credentials.db

    return db
