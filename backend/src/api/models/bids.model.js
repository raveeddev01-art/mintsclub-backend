const mongoose = require('mongoose')
const Nft = require('../models/nfts.model')
const User = require('../models/users.model')
const Notification = require('../models/notification.model')
const ObjectId = require('mongoose').Types.ObjectId
const Auction = require('../models/auctions.model')
const socket = require('../../utils/socket')

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
        status: {
            type: String,
            enum: ['pending', 'claimable', 'outbid', 'winner', 'refunded'],
            default: 'pending',
        },
        blockchainType: { type: String },
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

BidSchema.post('save', async function (doc) { 
    let price = 0
    if (doc?.blockchainType !== 'algorand') {
        price = (5 / 100) * doc?.bidAmount + doc?.bidAmount
    } else {
        price = doc?.bidAmount + 0.1
    }
    socket.io.to(`${doc?.nftId}`).emit('bidPlaced', { price })
    

    Notification.create({
        toUserId: doc.ownerId,
        fromUserId: doc.bidBy,
        type: 'addBid',
        nftId: doc.nftId,
        auctionId: doc.auctionId,
    })
    socket.io.emit('addBid', {
        addBid: 'addBid',
    })
    Notification.create({
        toUserId: doc?.bidBy,
        fromUserId: doc?.bidBy,
        type: 'upBid',
        nftId: doc?.nftId,
        auctionId: doc?.auctionId,
    })
    socket.io.emit('upBid', {
        addBid: 'addBid',
    })
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

// BidSchema.post('findOneAndUpdate', async function (next) {
//     const docToUpdate = await this.model.findOne(this.getQuery())
// }
/**
 * @typedef Bid
 */
 
module.exports = mongoose.model('Bid', BidSchema)
