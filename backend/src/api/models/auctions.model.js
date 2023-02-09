const mongoose = require('mongoose')
const Bid = require('../models/bids.model')
const NFT = require('../models/nfts.model')
const socket = require('../../utils/socket')
const Notification = require('../models/notification.model')

/**
 * Auction Schema
 * @private
 */
const AuctionSchema = new mongoose.Schema(
    {
        startDate: { type: Date },
        endDate: { type: Date },
        status: {
            type: String,
            enum: [
                'active',
                'claimNft',
                'reclaimNft',
                'claimPrice',
                'end',
                'cancelled',
                'ended',
            ],
            default: 'active',
        },
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
        txnHash: { type: String },
        sellerTradeState: { type: String },
        sellerPublicKey: { type: String },
        signature: { type: String },
        bids: [{ type: mongoose.Schema.Types.ObjectId, ref: Bid }],
        highestBidder: { type: String},
        highestBidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        globalState: { type: Object, default: null },
        auctionStarted: { type: Boolean, default: false },
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

AuctionSchema.post('save', async function (next) {
    try {
        let price = 0
        let appId = 0

        if (Number(this.sellingMethod) === 1) {
            price = this.sellingConfig.price.amount
            appId = this.sellId
        } else {
            price = this?.sellingConfig?.startPrice?.amount
        }
        await NFT.findByIdAndUpdate(
            { _id: this.nftId },
            {
                $set: {
                    activeAuction: this._id,
                    currentPrice: price,
                    appId,
                },
            },
            { new: true }
        )

        socket.io.to(`${this.nftId}`).emit('auctionCreated', {
            auctionId: this?._id,
            nftId: this?.nftId,
        })

        socket.io.emit('newAuctionCreated', {
            auctionId: this?._id,
            createdBy: this?.userId,
            nftId: this?.userId,
        })
    } catch (error) {
        console.log('error', error)
    }
})

AuctionSchema.post('findOneAndUpdate', async function (doc) {
    const id = doc._id;
    const data = await Auction.findOne(id)

    if (data.status === 'claimNft' || data.status === 'reclaimNft') {
        Notification.create({
            toUserId: data?.userId,
            fromUserId: data?.userId,
            type: 'endAuction',
            nftId: data?.nftId,
            auctionId: data?._id,
        })
    }
    socket.io.emit('endAuction', {
        addBid: 'addBid',
    })
    if (
        data.auctionStarted === true &&
        data.status === 'active' &&
        data.highestBid === 0
    ) {
        Notification.create({
            toUserId: data.userId,
            fromUserId: data.userId,
            type: 'startAuction',
            nftId: data?.nftId,
            auctionId: data._id,
        })
    }
    socket.io.emit('startAuction', {
        addBid: 'addBid',
    })

    if (data.status === 'claimNft' && data.highestBidderId) {
        Notification.create({
            toUserId: data.highestBidderId,
            fromUserId: data.highestBidderId,
            type: 'claimNft',
            nftId: data?.nftId,
            auctionId: data?._id,
        })
    }
    socket.io.emit('claimNft', {
        addBid: 'addBid',
    })
    if (data.status === 'end' && data.sellingMethod === 1 && data.auctionEnded === true) {
        Notification.create({
            toUserId: data?.userId,
            fromUserId: data?.userId,
            type: 'buyNft',
            nftId: data?.nftId,
            auctionId: data?._id,
        })
    }
    socket.io.emit('buyNft', {
        addBid: 'addBid',
    })
    if (data.status === 'active' && doc.highestBidderId && data.auctionEnded === false) {
        Notification.create({
            toUserId: doc?.highestBidderId,
            fromUserId: doc?.userId,
            type: 'upBid',
            nftId: doc?.nftId,
            auctionId: doc?.auctionId,
        })
    }
    socket.io.emit('upBid', {
        addBid: 'addBid',
    })
})
let Auction  = mongoose.model('Auction', AuctionSchema)
module.exports = Auction