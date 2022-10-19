const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/likes.controller')

router.route('/likeDislike').post(controller.likeDislike)
router.route('/getNftLikes').get(controller.getNftLikes)
router.route('/userNftLikes').get(controller.userNftLikes)

module.exports = router
