const BatchUpload = require('../../models/batchUpload.model')

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

