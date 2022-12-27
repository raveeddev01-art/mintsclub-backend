const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/admin/categories.controller.js')
const { cpUpload } = require('../../../utils/upload')

router.route('/create').post(cpUpload, controller.create)
router.route('/edit').put(cpUpload, controller.edit)
router.route('/delete/:categoryId').delete(controller.delete)
router.route('/get/:categoryId').get(controller.get)
router.route('/list').get(controller.list)

module.exports = router
