const mongoose = require('mongoose')
const Bid = require('../models/bids.model')
const NFT = require('../models/nfts.model')

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
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sellingMethod: { type: Number },
        sellingConfig: { type: Object },
        auctionStartDate: { type: Date },
        auctionEndDate: { type: Date },
        highestBid: { type: Number },
        copiesForAuction: { type: Number },
        auctionEnded: { type: Boolean },
        sellId: { type: Number },
        bids: [{ type: mongoose.Schema.Types.ObjectId, ref: Bid }],
        // bids: [
        //     { bidId: { type: mongoose.Schema.Types.ObjectId, ref: Bid } },
        //     { bidAmount: { type: Number } },
        // ],
    },
    { timestamps: true }
)

/**
 * @typedef Auction
 */

// AuctionSchema.post('save', async function (next) {
//     try {
//         // payload.highestBid = payload.sellingConfig.startPrice.amount
//         //     ? Number(payload.sellingConfig.startPrice.amount)
//         //     : 0
//         console.log('this', this)
//         await NFT.findByIdAndUpdate(
//             { _id: this.nftId },
//             {
//                 $set: {
//                     activeAuction: this._id,
//                     currentPrice: Number(this.sellingConfig.startPrice.amount),
//                 },
//             },
//             { new: true }
//         )
//     } catch (error) {
//         console.log('error', error)
//         // next(error)
//     }
// })

module.exports = mongoose.model('Auction', AuctionSchema)
