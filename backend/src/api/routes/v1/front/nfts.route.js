// const express = require('express')
const router = require('express').Router()
const controller = require('../../../controllers/front/nfts.controller')
const { cpUpload } = require('../../../utils/upload')
const {uploadDataOnIpfs}=require('../../../utils/uploadImage')
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/nftValidation')

router
    .route('/upload/ipfs')
    .post(
        middleware.userValidation,
        validatorMiddleware.validateNFTSchema,
        uploadDataOnIpfs,
        controller.create
    )
// router.route('/edit').put(cpUpload, controller.edit)
router
    .route('/get/:nftId')
    .get(validatorMiddleware.validateNftId, controller.get)
router.route('/list').get(controller.list)
router.route('/editNft').patch(middleware.userValidation, controller.editNft)
router.route('/storeNFTData').post(cpUpload, controller.storeDataInDb)
router.route('/updateNft').put(middleware.userValidation, controller.updateNft)
router
    .route('/delete/:nftId')
    .delete(
        middleware.userValidation,
        validatorMiddleware.validateNftId,
        controller.delete
    )
router.route('/myNftListing').get(controller.myNftListing)
router.route('/getNFTsByCollection').post(controller.getNFTsbyCollection)
module.exports = router
