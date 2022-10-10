const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const cors = require('cors')
const adminRoutes = require('../api/routes/v1/admin/index')
const frontRoutes = require('../api/routes/v1/front/index')
const error = require('../api/middlewares/error')
const path = require('path')
const rateLimit = require('express-rate-limit')
const bearerToken = require('express-bearer-token')
const compression = require('compression')
const job = require('../cron-jobs/batchUpload')

/**
 * Express instance
 * @public
 */
const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app.use(bearerToken())

app.use(methodOverride())
const apiRequestLimiterAll = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 90000,
})

app.use('/v1/', apiRequestLimiterAll)

// let corsOptions = {
//     origin: [
//         'https://mintsclub-v3-marketplace.invo.zone',
//         'http://localhost:3000',
//         'https://mintsclub.io',
//     ],
//     optionsSuccessStatus: 200, // For legacy browser support
// }
// app.use(cors(corsOptions))
let corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))


// error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({
        status: err.status,
        message: err.message,
        data: {},
    })
})
// compress all responses
app.use(compression())
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader(
//         'Access-Control-Allow-Methods',
//         'OPTIONS, GET, POST, PUT, PATCH, DELETE' // what matters here is that OPTIONS is present
//     )
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//     next()
// })
// mount admin api v1 routes
app.use('/v1/admin', adminRoutes)

// mount admin api v1 routes
app.use('/v1/front', frontRoutes)

// Admin Site Build Path
app.use('/admin/', express.static(path.join(__dirname, '../../admin')))
app.get('/admin/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../../admin', 'index.html'))
})
// TODO: Handle errors with centralized way.

// if error is not an instanceOf APIError, convert it.
app.use(error.converter)

// catch 404 and forward to error handler
app.use(error.notFound)
// error handler, send stacktrace only during development
app.use(error.handler)

//start cron jobs
// job.startCron();
job.batchCrone()

module.exports = app
