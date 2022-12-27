const express = require('express')
const controller = require('../../../controllers/front/auth.controller')
const router = express.Router()
const validatorMiddleware = require('../../../middlewares/front/validation')

router
    .route('/register')
    .post(validatorMiddleware.validateSignUpSchema ,controller.register)
router
    .route('/login')
    .post(validatorMiddleware.validateAddress ,controller.login)

module.exports = router
