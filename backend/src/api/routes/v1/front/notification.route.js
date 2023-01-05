const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/notification.controller')
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/validation')



router.route('./getUserUnseenNotification').get(middleware.userValidation, controller.getUserUnSeenNotification)
router.route('./updateUserUnseenNotification').post(middleware.userValidation, controller.updateNotification)
router.route('./getUserSeenNotification').get(middleware.userValidation, controller.getUserSeenNotification)
router.route('./getUserAllNotification').get(middleware.userValidation, controller.getAllNotifications)



module.exports = router
