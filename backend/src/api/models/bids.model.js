const mongoose = require('mongoose')

/**
 * Bid Schema
 * @private
 */
const BidSchema = new mongoose.Schema(
    {
        bidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        bidByProfile: { type: String },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT' },

        bidAmount: { type: Number },
        fromAddress: { type: String },
        toAddress: { type: String },
        isAccepted: { type: Boolean, default: false },
        expiryDate: { type: Date },
    },
    { timestamps: true }
)

// /**
//  * @typedef Bid
//  */

module.exports = mongoose.model('Bid', BidSchema)
