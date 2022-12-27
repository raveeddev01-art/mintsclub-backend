const mongoose = require('mongoose')
const Auction = require('../models/auctions.model')
const ObjectId = require('mongoose').Types.ObjectId

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

OfferSchema.post('findOneAndUpdate', async function (next) {
    const docToUpdate = await this.model.findOne(this.getQuery())

    await this.model.updateMany(
        { _id: { $ne: ObjectId(docToUpdate?.id) }, nftId: docToUpdate?.nftId },
        { $set: { isExpired: true } }
    )

    await Auction.updateOne(
        { _id: docToUpdate?.nftId },
        {
            $unset: {
                sellingMethod: undefined,
                sellingConfig: undefined,
                auctionEndDate: undefined,
                auctionEndTime: undefined,
                auctionStartDate: undefined,
                auctionStartTime: undefined,
            },
            $set: {
                ownerId: docToUpdate?.offerBy,
            },
        }
    )
})
/**
 * @typedef Offer
 */

module.exports = mongoose.model('Offer', OfferSchema)
