const Bid = require('../../models/bids.model')
const Nft = require('../../models/nfts.model')
const Auction = require('../../models/auctions.model')
const ObjectId = require('mongoose').Types.ObjectId
const validation = require('../../middlewares/front/bidValidation')
const nftValidation = require('../../middlewares/front/nftValidation')
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

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
        }

        const { error } = validation.validateCreateBid(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const bid = await Bid.create(payload)
        await Auction.findOneAndUpdate(
            { _id: payload?.auctionId },
            { $push: { bids: bid?._id }, highestBid: payload?.bidAmount }
        )
        if (bid) {
            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.BID_PLACED_SUCCESSFULLY,
                bid,
            })
        }
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
        const { error } = validation.validateBidId(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
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
        let { page, limit, nftId } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10
        const filter = {}
        if (nftId) filter.nftId = ObjectId(nftId)
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

        const { error } = nftValidation.validateNftId({ nftId })

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                data: error?.details[0]?.message,
            })
        }

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
        const { bidId } = req.body
        const { error } = validation.validateBidId({ bidId })
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                data: error?.details[0]?.message,
            })
        }
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
