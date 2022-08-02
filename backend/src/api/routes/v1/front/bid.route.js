const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/front/bid.controller');
const middleware=require('../../../middlewares/front/auth')

router.route('/create').post(middleware.userValidation,controller.create);
router.route('/delete/:bidId').delete(middleware.userValidation,controller.delete);
router.route('/list').get(controller.list);

router.route('/accept').put(controller.accept);
router
  .route('/claimableBidListbyNftId')
  .get(controller.claimableBidListbyNftId);

module.exports = router;
