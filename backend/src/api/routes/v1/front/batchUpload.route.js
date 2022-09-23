const express = require('express')
const router = express.Router()
const BatchUploadController=require('../../../controllers/front/batchUpload.controller')

router.route("/").post(BatchUploadController.batchUpload)
module.exports = router
