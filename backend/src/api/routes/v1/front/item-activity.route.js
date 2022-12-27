const express = require('express')
const router = express.Router()
const middleware = require('../../../middlewares/front/itemActivity')
const controller = require('../../../controllers/front/item-activity')
router.route('/create').post(middleware.validateCreateItemActivity ,controller.create)
router.route('/update').put(middleware.validateUpdateItemActivity ,controller.update)
router.route('/delete').delete(middleware.validateNFTid ,controller.delete)
router.route('/get').get(middleware.validateNFTid ,controller.get)
module.exports = router
