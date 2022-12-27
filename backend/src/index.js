/* eslint-disable no-global-assign */
Promise = require('bluebird')
const { port } = require('./config/vars')
const mongooseDatabase = require('./config/mongoose')
const app = require('./config/express')
const http = require('http')
mongooseDatabase.connect()
http.createServer(app).listen(port)
module.exports = app
