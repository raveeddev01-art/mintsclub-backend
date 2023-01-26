const mongoose = require('mongoose')
/**
 * Batch Upload Schema
 * @private
 */
const BatchUploadSchema = new mongoose.Schema(
    {
        location: { type: String },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        metaData: { type: String },
        ownerAddress: { type: String },
        fileName: { type: String },
        blockchainType: { type: String },
        collectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Collection',
            required: true,
        },
        categoryId: { type: String },
        key: { type: String },
        status: { type: String },
        currentFile: { type: Number },
        message: { type: String },
    },
    { timestamps: true }
)

module.exports = mongoose.model('BatchUpload', BatchUploadSchema)
