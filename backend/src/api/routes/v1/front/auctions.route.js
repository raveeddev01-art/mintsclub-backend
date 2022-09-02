const express = require('express')
const controller = require('../../../controllers/front/auctions.controller')
const router = express.Router()
const { cpUpload } = require('../../../utils/upload')
const middleware = require('../../../middlewares/front/auth')

router.route('/live').get(controller.live)
router.route('/edit').put(cpUpload, controller.edit)
router.route('/buyNft').post(middleware.userValidation, controller.buyNow)
router
    .route('/endAuction')
    .post(middleware.userValidation, controller.endAuction)

module.exports = router
