const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/collection.controller')
const { collectionUpload } = require('../../../utils/uploadImage')
const middleware = require('../../../middlewares/front/auth')
const validatorMiddleware = require('../../../middlewares/front/collectionValidation')

router
    .route('/create')
    .post(
        middleware.userValidation,
        collectionUpload,
        validatorMiddleware.validateCollectionSchema,
        controller.create
    )
router
    .route('/createDefault')
    .post(middleware.userValidation, controller.createDefault)
router
    .route('/edit')
    .put(
        collectionUpload,
        validatorMiddleware.validateEditCollectionSchema,
        controller.edit
    )
router
    .route('/delete/:collectionId')
    .delete(validatorMiddleware.validateCollectionId, controller.delete)
router
    .route('/get/:collectionId')
    .get(validatorMiddleware.validateCollectionId, controller.get)
router.route('/list').get(controller.list)
router.route('/myCollectionList').get(controller.myCollectionList)
router.route('/popular').get(controller.popular)
router.route('/deploy').post(controller.deploy)
module.exports = router
