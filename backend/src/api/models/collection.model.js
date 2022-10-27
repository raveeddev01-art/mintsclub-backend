const mongoose = require('mongoose')
const NFT = require('../models/nfts.model')

/**
 * Collection Schema
 * @private
 */
const CollectionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: { type: String, required: true },
        isApproved: { type: Boolean, required: false },
        logo: { type: String, required: true },
        featuredImg: { type: String },
        banner: { type: String },
        url: { type: String },
        description: { type: String },
        ownerAddress: { type: String },
        nft: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: NFT,
            },
        ],
        abi: { type: Array },
        deploy: { type: Boolean, required: true, default: false },
        contractAddress: { type: String, default: '' },
        blockchainType: { type: String, required: true },
    },
    { timestamps: true }
)

// CollectionSchema.post('findOne', async function (doc, next) {
//     // const doc = await this.model.findOne(this.getQuery())
//     console.log('docccccc', doc)
//
// })

/**
 * @typedef Collection
 */

module.exports = mongoose.model('Collection', CollectionSchema)
