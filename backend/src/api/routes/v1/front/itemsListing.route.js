const express = require('express');
const router = express.Router();
//done
const controller = require('../../../controllers/front/itemsListing.controller');
router.route('/list').get(controller.get);
module.exports = router;
