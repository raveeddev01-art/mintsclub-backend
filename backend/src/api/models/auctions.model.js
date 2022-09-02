const mongoose = require('mongoose')

/**
 * Auction Schema
 * @private
 */
const AuctionSchema = new mongoose.Schema(
    {
        startDate: { type: Date },
        endDate: { type: Date },
        nftId: { type: mongoose.Schema.Types.ObjectId, ref: 'NFT' },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sellingMethod: { type: Number },
        sellingConfig: { type: Object },
        auctionStartDate: { type: Date },
        auctionEndDate: { type: Date },
        highestBid: { type: Number },
        copiesForAuction: { type: Number },
        auctionEnded: { type: Boolean },
        sellId: { type: Number },
    },
    { timestamps: true }
)

/**
 * @typedef Auction
 */

module.exports = mongoose.model('Auction', AuctionSchema)
