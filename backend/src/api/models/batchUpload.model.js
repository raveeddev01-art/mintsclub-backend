const mongoose = require('mongoose')

/**
 * Batch Upload Schema
 * @private
 */
const BatchUploadSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        metaData: { type: String },
        ownerAddress: { type: String },
        fileName:{type:String},
        blockchainType:{type:String},
        collectionId:{type:String},
        categoryId:{type:String},
        key:{type:String},
        fileType:{type:String},
        status:{type:String},
        currentFile:{type:Number},
    },
    { timestamps: true }
)



module.exports = mongoose.model('BatchUpload', BatchUploadSchema)
