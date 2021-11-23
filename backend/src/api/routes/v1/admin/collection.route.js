const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/admin/collection.controller')

router.route('/list').get(controller.list)
router.route('/delete/:collectionId').delete(controller.delete)
router.route('/get/:collectionId').get(controller.get)

module.exports = router