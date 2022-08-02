const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/front/nfts.controller');
const { cpUpload } = require('../../../utils/upload');
const middleware=require('../../../middlewares/front/auth')

router.route('/create').post(middleware.userValidation,cpUpload, controller.create);
router.route('/edit').put(cpUpload, controller.edit);
router.route('/get/:nftId').get(controller.get);
router.route('/list').get(controller.list);
router.route('/editNft').patch(middleware.userValidation,controller.editNft);
router.route('/storeNFTData').post(cpUpload, controller.storeDataInDb);
router.route('/updateNft').put(middleware.userValidation,cpUpload, controller.updateNft);
router.route('/delete/:nftId').delete(middleware.userValidation,controller.delete);
router.route('/myNftListing').get(controller.myNftListing);
router.route('/getNFTsByCollection').post(controller.getNFTsbyCollection);
router.route('/buyNft').post(middleware.userValidation,controller.buyNow);
router.route('/endAuction').post(middleware.userValidation,controller.endAuction);
module.exports = router;


