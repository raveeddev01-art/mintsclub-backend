const httpStatus = require('http-status')
const expressValidation = require('express-validation')
const APIError = require('../utils/APIError')
const { env } = require('../../config/vars')

/**
 * Error handler. Send stacktrace only during development
 * @public
 */
const handler = (err, req, res) => {
    const response = {
        code: err.status,
        message: err.message || httpStatus[err.status],
        errors: err.errors,
        stack: err.stack,
    }

    if (env !== 'development') {
        delete response.stack
    }

    res.status(err.status)
    res.json(response)
}
exports.handler = handler

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
exports.converter = (err, req, res) => {
    let convertedError = err

    if (err instanceof expressValidation.ValidationError) {
        convertedError = new APIError({
            message: 'Validation Error',
            errors: err.errors,
            status: err.status,
            stack: err.stack,
        })
    } else if (!(err instanceof APIError)) {
        convertedError = new APIError({
            message: err.message,
            status: err.status,
            stack: err.stack,
        })
    }

    return handler(convertedError, req, res)
}

/**
 * Catch 404 and forward to error handler
 * @public
 */
exports.notFound = (req, res) => {
    const err = new APIError({
        message: 'Invalid route',
        status: httpStatus.NOT_FOUND,
    })
    return handler(err, req, res)
}

/**
 * Catch 422 for duplicate key
 * @public
 */
exports.checkDuplicate = (err, res, name = '') => {
    if (err.code === 11000 || err.code === 11001) {
        let message = `${name} with same `
        if (err.errmsg.includes('email_1')) message += 'email already exists'
        else {
            const pathRegex = err.message.match(/\.\$([a-z]+)/)
            const path = pathRegex ? pathRegex[1] : ''
            // eslint-disable-next-line no-useless-escape
            const keyRegex = err.message.match(/key:\s+{\s+:\s\"(.*)(?=\")/)
            const key = keyRegex ? keyRegex[1] : ''
            message = `'${path}' '${key}' already exists`
        }
        return res.status(200).send({ success: false, message })
    }
}
