const express = require('express')
const controller = require('../../../controllers/front/users.controller')
const router = express.Router()
const middleware = require('../../../middlewares/front/auth')

const { profileUpload } = require('../../../utils/uploadImage')
router.route('/').post(controller.create)
router
    .route('/updateProfile')
    .put(middleware.userValidation, profileUpload, controller.updateProfile)
router.route('/creators').post(controller.getCreators)
router.route('/top-sellers').get(controller.topSellers)
router.route('/:userId').get(controller.getUser)
router.route('/subscribe').post(controller.subscribeUser)

module.exports = router
