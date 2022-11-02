const moment = require('moment')
const NFT = require('../models/nfts.model')
const NftTokens = require('../models/nftTokens.model')
const nftAuctions = require('../models/auctions.model')
const Users = require('../models/users.model')
const ActivityModal = require('../models/item-activity.modal')
const Bid = require('../models/bids.model')

const getPendingHighestBigByAuctionId = async (auctionId) => {
    const data = await Bid.find({
        auctionId,
    })
        .sort({ createdAt: -1 })
        .limit(1)
    return data
}
const updateBid = async (id, data) => {
    return await Bid.findOneAndUpdate({ _id: id }, { $set: data })
}
module.exports = {
    getPendingHighestBigByAuctionId,
    updateBid,
}
