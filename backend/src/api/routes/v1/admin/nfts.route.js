const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/admin/nfts.controller')

router.route('/list').get(controller.list)
router.route('/delete/:nftId').delete(controller.delete)

module.exports = router