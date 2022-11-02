const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/bid.controller')
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/bidValidation')

router
    .route('/create')
    .post(
        middleware.userValidation,
        validatorMiddleware.validateCreateBid,
        controller.create
    )

router
    .route('/delete/:bidId')
    .delete(
        middleware.userValidation,
        validatorMiddleware.validateBidId,
        controller.delete
    )
router.route('/list').get(controller.list)

router.route('/accept').put(validatorMiddleware.validateBidId ,controller.accept)
router
    .route('/claimableBidListbyNftId')
    .get(validatorMiddleware.validateBidId, controller.claimableBidListbyNftId)

module.exports = router
