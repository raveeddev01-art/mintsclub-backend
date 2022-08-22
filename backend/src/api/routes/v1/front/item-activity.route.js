const express = require('express')
const router = express.Router()

const controller = require('../../../controllers/front/item-activity')
router.route('/create').post(controller.create)
router.route('/update').put(controller.update)
router.route('/delete').delete(controller.delete)
router.route('/get').get(controller.get)
module.exports = router
