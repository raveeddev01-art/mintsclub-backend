const express = require('express');
const controller = require('../../../controllers/front/auctions.controller');
const router = express.Router();
//done
router.route('/live').get(controller.live);

module.exports = router;