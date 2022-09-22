const BatchUpload = require('../../models/batchUpload.model')
const {getS3Object} =require('../../utils/s3Bucket')
exports.batchUpload = async (req, res, next) => {
    try {
        await BatchUpload.create(req.body)
        res.status(201).send({
            success: true,
            message: 'Batch uploading is added to the queue successfully',
        })
    } catch (err) {
        next(err)
    }
}

