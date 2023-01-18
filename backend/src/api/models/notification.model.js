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
                'claimNft',          
                'upBid',
                'addBid',
                // "auctionEnd",
                'endAuction',
                'startAuction',
                'bidWinner',
                
                'transferred',
                'batchUploaded',
                'auctionEnded',
                
            ],
        },
    },
    { timestamps: true }
)

notificationSchema.post('save', (doc) => {
    socket.io.to(`${doc?.toUserId}`).emit('notification', doc)
})

module.exports = model("Notification", notificationSchema);
