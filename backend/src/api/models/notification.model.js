const { model, Schema } = require('mongoose')
const socket = require('../../utils/socket')
// const mongoosePaginate = require("mongoose-paginate-v2");
const notificationSchema = new Schema(
    {
        toUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        auctionId: { type: Schema.Types.ObjectId, ref: 'Auction' },
        nftId: { type: Schema.Types.ObjectId, ref: 'Nft' },
        subNftId: { type: Schema.Types.ObjectId, ref: 'Nft' },
        collectionId: { type: Schema.Types.ObjectId, ref: 'Collection' },
        bidId: { type: Schema.Types.ObjectId, ref: 'Bid' },
        text: { type: String },
        batchId: { type: Schema.Types.ObjectId, ref: 'BatchUpload' },
        stakeId: { type: Schema.Types.ObjectId, ref: 'Stake' },
        isSeen: { type: Boolean, default: false },
        type: {
            type: String,
            enum: [
                // "refundBid",
                'claimNft',
                // "claimPrice",
                'upBid',
                'addBid',
                // "auctionEnd",
                // "reClaimNft",
                'endAuction',
                'startAuction',
                'bidWinner',
                // "noBidAuctionEnded",
                // "staked",
                // "successfulPurchase",
                // "fractionSold",
                // "claimMainNft",
                'transferred',
                'batchUploaded',
                // "launchUploaded",
                // "rentTimeout",
                // "getRentedNft",
                // "nftReturned",
                // "securityClaimed",
                // "claimedRentedNft",
                // "noRenter",
            ],
        },
    },
    { timestamps: true }
)

notificationSchema.post('save', (doc) => {
    socket.io.to(`${doc?.toUserId}`).emit('notification', doc)
})

// notificationSchema.plugin(mongoosePaginate);
// const Nft = model("Notification", notificationSchema);
// module.exports = Nft;
module.exports = model("Notification", notificationSchema);
