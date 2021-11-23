const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/admin/users.controller')

router.route('/list').get(controller.list)
router.route('/delete/:userId').delete(controller.delete)

module.exports = router