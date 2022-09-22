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
        signature: { type: String },
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
//         let price = this.sellingConfig.startPrice.amount
//         if (Number(this.sellingMethod) === 1) {
//             price = this.sellingConfig.price.amount
//         }
//         await NFT.findByIdAndUpdate(
//             { _id: this.nftId },
//             {
//                 $set: {
//                     activeAuction: this._id,
//                     currentPrice: price,
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
