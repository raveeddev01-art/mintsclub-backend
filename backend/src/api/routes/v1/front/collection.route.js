const express = require('express')
const router = express.Router()
const controller = require('../../../controllers/front/collection.controller')
const { collectionUpload } = require('../../../utils/uploadImage')
const middleware = require('../../../middlewares/front/auth')

router
    .route('/create')
    .post(middleware.userValidation, collectionUpload, controller.create)
router.route('/edit').put(collectionUpload, controller.edit)
router.route('/delete/:collectionId').delete(controller.delete)
router.route('/get/:collectionId').get(controller.get)
router.route('/list').get(controller.list)
router.route('/myCollectionList').get(controller.myCollectionList)
router.route('/popular').get(controller.popular)
router.route('/deploy').post(controller.deploy)
module.exports = router
