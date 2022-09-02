// const express = require('express')
const router = require('express').Router()
const controller = require('../../../controllers/front/nfts.controller')
const { cpUpload } = require('../../../utils/upload')
const middleware = require('../../../middlewares/front/auth')
// const validate = require('express-joi-validate')
// const { validateNftId } = require('../../../middlewares/front/nftValidation')
router
    .route('/create')
    .post(middleware.userValidation, cpUpload, controller.create)
// router.route('/edit').put(cpUpload, controller.edit)
router.get('/get/:nftId', controller.get)
router.route('/list').get(controller.list)
router.route('/editNft').patch(middleware.userValidation, controller.editNft)
router.route('/storeNFTData').post(cpUpload, controller.storeDataInDb)
router
    .route('/updateNft')
    .put(middleware.userValidation, cpUpload, controller.updateNft)
router
    .route('/delete/:nftId')
    .delete(middleware.userValidation, controller.delete)
router.route('/myNftListing').get(controller.myNftListing)
router.route('/getNFTsByCollection').post(controller.getNFTsbyCollection)
module.exports = router
