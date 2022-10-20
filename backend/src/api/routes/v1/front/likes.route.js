const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/likes.controller')
const middleware = require('../../../middlewares/front/likes')

router.route('/likeDislike').post(middleware.validateLikesDislikeSchema,controller.likeDislike)
router.route('/getNftLikes').get(controller.getNftLikes)
router.route('/userNftLikes').get(controller.userNftLikes)

module.exports = router
