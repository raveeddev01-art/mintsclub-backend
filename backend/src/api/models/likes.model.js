const mongoose = require('mongoose')

/**
 * NFTOwner Schema
 * @private
 */
const LikesSchema = new mongoose.Schema(
    {
        nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT' },
        count: { type: Number },
        likes: [{ userId: String }],
    },
    { timestamps: true }
)

/**
 * @typedef LikesSchema
 */

module.exports = mongoose.model('LikesSchema', LikesSchema)
