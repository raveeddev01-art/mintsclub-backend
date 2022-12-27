const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/offer.controller')
const middleware = require('../../../middlewares/front/offerValidation')
const validatorMiddleware = require('../../../middlewares/front/validation')

router.route('/create').post(middleware.validateOfferSchema, controller.create)
router
    .route('/delete/:offerId')
    .delete(validatorMiddleware.validateId, controller.delete)
router.route('/list').get(controller.list)
router.route('/accept').put(validatorMiddleware.validateId, controller.accept)

module.exports = router
