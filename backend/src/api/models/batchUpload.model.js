const mongoose = require('mongoose')
const Notification = require('../models/notification.model')
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


BatchUploadSchema.post('findOneAndUpdate', async function(doc){
    const id = doc._id;
    const data = await BatchUpload.findOne(id)

    if(data.status === "completed") {
        Notification.create({
            toUserId: data?.userId,
            fromUserId: data?.userId,
            type: 'batchUploaded',
            nftId: data?.userId,
            auctionId: data?.userId,
            
        })
    }
    
})
const BatchUpload =mongoose.model('BatchUpload', BatchUploadSchema)
module.exports = BatchUpload
