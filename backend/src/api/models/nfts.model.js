const mongoose = require('mongoose')
const Collection = require('../models/collection.model')
const NftTokens = require('../models/nftTokens.model')
const ActivityModal = require('../models/item-activity.modal')

/**
 * NFT Schema
 * @private
 */
const NFTSchema = new mongoose.Schema(
    {
        name: { type: String },
        description: { type: String },
        creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        nftOwnerId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        collectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Collection',
        },
        activeAuction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auction',
            default: null,
        },
        currentPrice: { type: Number, default: 0 },
        ownerAddress: { type: String },
        txHash: { type: String },
        tokenId: { type: Number },
        image: { type: String },
        fileType: { type: String },
        properties: { type: Array },
        levels: { type: Array },
        stats: { type: Array },
        copies: { type: Number, default: 0 },

        // status: { type: Number, default: 1 }, // 1 = Put on Sale, 2 = Instant Sale Price, 3 = Unlock Purchased
        // sold: { type: Number, default: 0 },
        // sellingMethod: { type: Number }, // 1 = Fixed Price, 2 = Timed Auction
        // sellingConfig: { type: Object },
        // auctionStartDate: { type: Date },
        // auctionEndDate: { type: Date },
        metaData: { type: String }, // ipfs link
        // highestBid: { type: Number },
        // copiesForAuction: { type: Number },
        remainingCopies: { type: Number },
        // auctionEnded: { type: Boolean },
        sellId: { type: Number },
    },
    { timestamps: true, collection: 'nfts' }
)

NFTSchema.post('save', async function (next) {
    try {
        // const err = new Error('something went wrong');
        const collectionRecord = await Collection.findOne({
            _id: this.collectionId,
        })

        collectionRecord.nft.push(this?._id)
        collectionRecord.save()

        const nftTokenPayload = {
            nftToken: this.token,
            nftId: this._id,
            tokenStandard: this.tokenStandard ? this.tokenStandard : 'ERC-1155',
        }

        await NftTokens.create(nftTokenPayload)

        //add activity
        const activityPayload = {
            ownerId: this.ownerId,
            toAddress: this.ownerAddress,
            nftId: this._id,
            activityType: 'Mint',
        }

        await ActivityModal.create(activityPayload)
        // next(err);
        // throw new Error('!!!!!!!!something went wrong')
    } catch (error) {
        console.log('error', error)
        // next(error)
    }
})

/**
 * @typedef NFT
 */

module.exports = mongoose.model('NFT', NFTSchema)
