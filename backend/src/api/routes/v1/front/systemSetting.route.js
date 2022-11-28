const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/systemSetting.controller')

router.route('/addSystemSetting').post(controller.addSystemSetting)

router.route('/getAllSystemSetting').get(controller.getSystemSetting)

router.route('/updateSystemSetting').post(controller.updateSystemSetting)

module.exports = router
