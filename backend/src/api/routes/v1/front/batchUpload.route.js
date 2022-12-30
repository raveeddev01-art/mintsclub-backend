const express = require('express')
const router = express.Router()
const middleware = require('../../../middlewares/front/auth')
const BatchUploadController = require('../../../controllers/front/batchUpload.controller')

router.route('/').post(BatchUploadController.batchUpload)
router
    .route('/verifyFileAlreadyProcessed')
    .get(BatchUploadController.verifyFileAlreadyProcessed)

router.route('/getBatchesByUser').get(BatchUploadController.getBatchByUser)

module.exports = router
