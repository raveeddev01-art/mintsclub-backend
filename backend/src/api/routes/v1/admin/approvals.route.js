const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/admin/approvals.controller')

router.route('/list').get(controller.getApprovals)
router.route('/edit').get(controller.updateApproval)

module.exports = router
