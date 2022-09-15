const mongoose = require('mongoose')
const Nft = require('../models/nfts.model')
const User = require('../models/users.model')
const ObjectId = require('mongoose').Types.ObjectId
const Auction = require('../models/auctions.model')

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
        nftId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NFT',
            required: true,
        },
        auctionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auction',
            required: true,
        },
        bidAmount: { type: Number },
        fromAddress: { type: String },
        toAddress: { type: String },
        isAccepted: { type: Boolean, default: false },
        expiryDate: { type: Date },
    },
    { timestamps: true }
)

/**
 * Methods
 */

BidSchema.pre('save', async function (next) {
    try {
        const bidUser = await User.findOne({ _id: this?.bidBy })
        this.bidByProfile = bidUser.profileImage ? bidUser.profileImage : null
    } catch (error) {
        console.log('error', error)
        // next(error)
    }
})
// BidSchema.post('save', async function (next) {
//     try {
//         console.log('this', this)
//         const check = await Auction.findOneAndUpdate(
//             { _id: this?.auctionId },
//             { $push: { bids: this._id }, highestBid: this.bidAmount }
//         )
//         console.log('check', check)
//     } catch (error) {
//         console.log('error', error)
//         // next(error)
//     }
// })

BidSchema.post('findOneAndUpdate', async function (next) {
    const docToUpdate = await this.model.findOne(this.getQuery())

    await this.model.updateMany(
        { _id: { $ne: ObjectId(docToUpdate?._id) }, nftId: docToUpdate?.nftId },
        { $set: { isClaimable: true, isExpired: true } }
    )

    await Nft.findById({ _id: docToUpdate?.nftId })

    await Auction.updateOne(
        { nftId: docToUpdate?.nftId },
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
                ownerId: docToUpdate?.bidBy,
                nftOwnerId: docToUpdate?.bidBy,
            },
        }
    )

    await Nft.updateOne(
        { _id: docToUpdate?.nftId },
        {
            $set: {
                ownerId: docToUpdate?.bidBy,
                nftOwnerId: docToUpdate?.bidBy,
            },
        }
    )
})

/**
 * @typedef Bid
 */

module.exports = mongoose.model('Bid', BidSchema)
