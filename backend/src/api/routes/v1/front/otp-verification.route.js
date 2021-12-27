const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/otp-verification.contoller')

router.route('/sendVerficationEmail').post(controller.sendEmail)
router.route('/verify').post(controller.verify)

module.exports = router