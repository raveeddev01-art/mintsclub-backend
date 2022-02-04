const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/front/likes.controller');



router.route('/likeDislike').post(controller.likeDislike);
router.route('/get').get(controller.get);



module.exports = router;