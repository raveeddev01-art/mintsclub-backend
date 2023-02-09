const Bid = require('../../models/bids.model')
const Nft = require('../../models/nfts.model')
const Auction = require('../../models/auctions.model')
const ObjectId = require('mongoose').Types.ObjectId
const nftValidation = require('../../middlewares/front/nftValidation')
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const helpers = require('../../helpers')
const Notification = require('../../models/notification.model')
const socket = require('../../../utils/socket')

// API to create bid validateNftId
exports.create = async (req, res, next) => {
    try {
        const payload = {
            bidBy: req.body.bidBy,
            ownerId: req.body.ownerId,
            nftId: req.body.nftId,
            bidAmount: req.body.bidAmount,
            isAccepted: req.body.isAccepted,
            expiryDate: req.body.expiryDate,
            fromAddress: req.body.fromAddress,
            toAddress: req.body.toAddress,
            auctionId: req.body.auctionId,
            blockchainType: req.body.blockchainType,
        }
        let globalState = undefined
        if (req.body?.globalState) {
            globalState = req.body?.globalState
        }
        // helper function to fetch existing bid

        const maxBidByAnotherUser =
            await helpers.bid.getPendingHighestBigByAuctionId(payload.auctionId)

        const bid = await Bid.create(payload)
        const auctionDetails = await Auction.findOne().where(
            '_id',
            payload.auctionId
        )
        if (auctionDetails?.status === 'reclaimNft' && bid) {
            await Auction.findOneAndUpdate(
                { _id: payload?.auctionId },
                {
                    status: 'claimNft',
                }
            )
        }
        await Auction.findOneAndUpdate(
            { _id: payload?.auctionId },
            {
                $push: { bids: bid?._id },
                highestBid: payload?.bidAmount,
                highestBidder: payload?.fromAddress,
                highestBidderId: payload?.bidBy,
                globalState,
            }
        )
        

        if (bid) {
            // helper function to update existing bid
            if (
                maxBidByAnotherUser?.length > 0 &&
                payload.blockchainType === 'solana'
            ) {
                const data = {
                    status: 'claimable',
                }
                const updateBid = await helpers.bid.updateBid(
                    maxBidByAnotherUser[0]?._id,
                    data
                )
            }

            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.BID_PLACED_SUCCESSFULLY,
                bid,
            })
        }
        socket.io.to(`${auctionDetails?.nftId}`).emit('bidPlaced', {
            nftId: auctionDetails?.nftId,
        })
        return res.send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.WENT_WRONG,
        })
    } catch (error) {
        return next(error)
    }
}

// API to delete bid
exports.delete = async (req, res, next) => {
    try {
        const { bidId } = req.params
        const payload = {
            bidId,
        }

        const bid = await Bid.deleteOne({ _id: payload.bidId })

        if (bid && bid?.deletedCount === 1)
            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.BID_CANCELED_SUCCESSFULLY,
            })
        else
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.BID_NOT_FOUND,
            })
    } catch (error) {
        return next(error)
    }
}

// API to get bids list
exports.list = async (req, res, next) => {
    try {
        let { page, limit, nftId, auctionId } = req.query

        if (!auctionId || auctionId === 'undefined' || auctionId == 'null') {
            return res
                .status(HTTP_STATUS_CODE.OK)
                .send({ success: false, message: 'Auction Id not found' })
        }
        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10
        const filter = {}
        if (auctionId) {
            filter.auctionId = ObjectId(auctionId)
        }
        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        const allBids = await Bid.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
        ])

        const data = {}

        data.totalRecords = allBids.length

        if (endIndex < allBids.length) {
            data.next = {
                page: page + 1,
                limit,
            }
        }
        if (startIndex > 0) {
            data.previous = {
                page: page - 1,
                limit,
            }
        }

        data.Bids = allBids.slice(startIndex, endIndex)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.BID_FETCHED,
            data,
        })
    } catch (error) {
        return next(error)
    }
}

// API to get bids list by NFT Id
exports.claimableBidListbyNftId = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const { nftId } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        const bidsByNftId = await Bid.find({ nftId })

        const data = {}

        data.totalRecords = bidsByNftId?.length

        if (endIndex < bidsByNftId.length) {
            data.next = {
                page: page + 1,
                limit,
            }
        }
        if (startIndex > 0) {
            data.previous = {
                page: page - 1,
                limit,
            }
        }

        data.Bids = bidsByNftId.slice(startIndex, endIndex)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.BID_BY_NFT_ID,
            data,
        })
    } catch (error) {
        return next(error)
    }
}

// API to accept bid
exports.accept = async (req, res, next) => {
    try {
        const { bidId } = req.params // changed from body to params for testing (hamza)

        const bid = await Bid.findOneAndUpdate(
            { _id: bidId },
            { isAccepted: true },
            { new: true }
        )
        if (!bid || bid === null) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.BID_NOT_FOUND,
            })
        } else {
            await Bid.updateMany(
                { _id: { $ne: ObjectId(bidId) }, nftId: bid.nftId },
                { $set: { isClaimable: true, isExpired: true } }
            )

            await Nft.findById({ _id: bid.nftId })

            await Nft.updateOne(
                { _id: bid.nftId },
                {
                    $set: {
                        ownerId: bid.bidBy,
                        nftOwnerId: bid.bidBy,
                    },
                }
            )
            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.BID_ACCEPTED_SUCCESSFULLY,
            })
        }
    } catch (error) {
        return next(error)
    }
}

exports.updateBid = async (req, res, next) => {
    try {
        const payload = {
            bidId: req.body.bidId,
            bidStatus: req.body.status,
        }

        const bid = await Bid.find({ _id: payload.bidId })
        if (!bid || bid === null) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.BID_NOT_FOUND,
            })
        } else {
            const data = {
                status: payload.bidStatus,
            }
            const updateBid = await helpers.bid.updateBid(payload.bidId, data)

            return res.status(HTTP_STATUS_CODE.OK).json(updateBid)
        }
    } catch (error) {
        return next(error)
    }
}
