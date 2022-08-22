const mongoose = require('mongoose')

/**
 * Offer Schema
 * @private
 */
const OfferSchema = new mongoose.Schema(
    {
        fromAddress: { type: String },
        toAddress: { type: String },
        offerBy: { type: String },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // owner at time of offer
        nftId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NFT',
            required: true,
        },
        price: { type: Number, required: true },
        isAccepted: { type: Boolean, default: false, required: true },
        isExpired: { type: Boolean, default: false, required: true },
    },
    { timestamps: true }
)

/**
 * @typedef Offer
 */

module.exports = mongoose.model('Offer', OfferSchema)
