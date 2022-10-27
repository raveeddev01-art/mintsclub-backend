const express = require('express')
const controller = require('../../../controllers/front/users.controller')
const router = express.Router()
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/validation')

const { profileUpload } = require('../../../utils/uploadImage')
router.route('/').post(controller.create)
router
    .route('/updateProfile')
    .put(
        middleware.userValidation,
        validatorMiddleware.validateUserProfile,
        profileUpload,
        controller.updateProfile
    )
router.route('/creators').post(controller.getCreators)
router.route('/top-sellers').get(controller.topSellers)
router.route('/:userId').get(validatorMiddleware.validateUser, controller.getUser)
router.route('/subscribe').post(controller.subscribeUser)
router.route('/validate/:address').post(controller.signUser)
router
    .route('/createUser')
    .post(validatorMiddleware.validateAddress, controller.createUser)
router.route('/authenticate').post(controller.authenticate)
router.route('/sign-nonce').post(controller.signNonce)

module.exports = router
