const express = require('express')
const controller = require('../../../controllers/front/auctions.controller')
const router = express.Router()
const { cpUpload } = require('../../../utils/upload')
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/auctionValidation')

router.route('/live').get(controller.live)
router
    .route('/create')
    .post(
        validatorMiddleware.validateNFTFixedTAuctionSchema,
        validatorMiddleware.validateNFTimedTAuctionSchema,
        cpUpload,
        controller.create
    )
router
    .route('/buyNft')
    .post(
        validatorMiddleware.validateBuyNowSchema,
        middleware.userValidation,
        controller.buyNow
    )
router
    .route('/endAuction')
    .post(
        validatorMiddleware.validateAuctionEndSchema,
        middleware.userValidation,
        controller.endAuction
    )

module.exports = router
