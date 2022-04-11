const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/front/bid.controller');

router.route('/create').post(controller.create);
router.route('/delete/:bidId').delete(controller.delete);
router.route('/list').get(controller.list);

router.route('/accept').put(controller.accept);
router
  .route('/claimableBidListbyNftId')
  .get(controller.claimableBidListbyNftId);

module.exports = router;
