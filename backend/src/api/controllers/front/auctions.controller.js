const moment = require('moment')
const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const Categories = require('../../models/categories.model')
const nftAuctions = require('../../models/auctions.model')
const Bid = require('../../models/bids.model')
const helpers = require('../../helpers')

const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
    ERROR_MESSAGE,
} = require('../../../config/constants')

// API to get live auctions
exports.live = async (req, res, next) => {
    try {
        let { page, limit, myFilter } = req.query
        let filter, newFilter
        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10
        const dateTime = new Date(moment().utc(false).toISOString())

        if (myFilter) {
            const applyFilter = await Categories.findOne({}, '_id').where(
                'description',
                myFilter
            )
            if (!applyFilter) {
                return res.status(400).send({
                    success: false,
                })
            }
            newFilter = applyFilter._id
        }

        if (myFilter && myFilter !== 'all') {
            filter = {
                sellingMethod: 2, // timed auctions only
                auctionStartDate: {
                    $lt: dateTime,
                },
                auctionEndDate: { $gte: dateTime },
                'nft.categoryId': ObjectId(newFilter),
                auctionEnded: false,
            }
        } else {
            filter = {
                sellingMethod: 2, // timed auctions only
                auctionStartDate: {
                    $lt: dateTime,
                },
                auctionEndDate: { $gte: dateTime },
                auctionEnded: false,
            }
        }

        const total = nftAuctions.countDocuments(filter)

        const pipeline = [
            {
                $match: filter,
            },
            {
                $lookup: {
                    from: 'nfts',
                    foreignField: '_id',
                    localField: 'nftId',
                    as: 'nft',
                },
            },
            {
                $unwind: {
                    path: '$nft',
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $lookup: {
                    from: 'bids',
                    foreignField: '_id',
                    localField: 'bids',
                    as: 'totalBids',
                },
            },
            {
                $addFields: {
                    bidsCount: { $size: '$totalBids' },
                },
            },
            {
                $lookup: {
                    from: 'bids',
                    foreignField: '_id',
                    localField: 'bids',
                    as: 'bids',
                    pipeline: [{ $limit: 2 }],
                },
            },
            {
                $unwind: {
                    path: '$bids',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'userId',
                    as: 'user',
                },
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $group: {
                    _id: '$_id',
                    copiesForAuction: { $first: '$copiesForAuction' },
                    auctionStartDate: { $first: '$auctionStartDate' },
                    auctionEndDate: { $first: '$auctionEndDate' },
                    highestBid: { $first: '$highestBid' },
                    bidDetail: {
                        $push: {
                            _id: '$bids._id',
                            bidByProfile: '$bids.bidByProfile',
                        },
                    },
                    Totalbids: { $first: '$bidsCount' },
                    userId: { $first: '$user._id' },
                    username: { $first: '$user.username' },
                    ownerAddress: { $first: '$nft.ownerAddress' },
                    profilePhoto: {
                        $first: '$user.profileImage',
                    },
                    nftId: { $first: '$nft._id' },
                    nftName: { $first: '$nft.name' },
                    nftImage: { $first: '$nft.image' },
                    compressedFile: { $first: '$nft.compressedFile' },
                    currentPrice: { $first: '$nft.currentPrice' },
                    fileType: { $first: '$nft.fileType' },
                    createdAt: { $first: '$createdAt' },
                },
            },
            { $sort: { createdAt: -1 } },
        ]

        const auctions = nftAuctions.aggregate(pipeline)
        const auctionList = await Promise.all([total, auctions])
        const allAuctions = auctionList[1]

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.LIVE_AUCTIONS,
            data: {
                auctions: auctionList[1],
                pagination: {
                    page,
                    limit,
                    total: allAuctions.length,
                    pages:
                        Math.ceil(auctionList[0] / limit) <= 0
                            ? 1
                            : Math.ceil(auctionList[0] / limit),
                },
            },
        })
    } catch (error) {
        return next(error)
    }
}

exports.create = async (req, res, next) => {
    try {
        const payload = req.body

        if (!payload.sellingMethod) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SELLING_METHOD,
            })
        }

        const getNFT = await NFT.findOne({
            _id: payload.nftId,
        })
        if (!getNFT) {
            return res.status(HTTP_STATUS_CODE.NOT_FOUND).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.COPIES_FOR_AUCTION_CHECK,
            })
        }

        if (getNFT.remainingCopies < payload.copiesForAuction) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NO_DATA_FOUND,
            })
        }

        if (Number(payload.sellingMethod) === 1) {
            // payload.sellingConfig = JSON.parse(payload.sellingConfig)
            helpers.auction.addFixedAuction(payload)
        } else {
            helpers.auction.addTimedAuction(payload)
        }

        const nftAuction = await nftAuctions.create(payload)
        return res.status(HTTP_STATUS_CODE.CREATED).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_PUT_ON_SELL,
            nftAuction,
        })
    } catch (error) {
        return next(error)
    }
}

exports.buyNow = async (req, res, next) => {
    try {
        const payload = req.body

        const buyNftDetail = await NFT.findOne({
            _id: payload.nftId,
        })

        const nftAuctionDetail = await nftAuctions.findOne({
            nftId: payload.nftId,
        })

        //in lazy minting case
        if (req.body?.tokenId) {
            await NFT.findByIdAndUpdate(
                { _id: payload.nftId },
                { $set: { tokenId: req.body.tokenId } },
                { new: true }
            )
        }
        let copiesCondition = true
        if (buyNftDetail?.blockchainType !== 'solana') {
            copiesCondition =
                nftAuctionDetail?.copiesForAuction > 0 ? true : false
        }

        if (buyNftDetail && copiesCondition) {
            if (
                buyNftDetail.remainingCopies >
                    nftAuctionDetail?.copiesForAuction &&
                buyNftDetail?.blockchainType !== 'solana'
            ) {
                const updateData = await helpers.auction.createNewNFTtoBuy(
                    payload,
                    buyNftDetail,
                    nftAuctionDetail
                )

                if (updateData) {
                    return res.status(HTTP_STATUS_CODE.OK).send({
                        success: SUCCESS_STATUS.TRUE,
                        message: SUCCESS_MESSAGE.OWNERSHIP_TRANSFERED,
                    })
                }
            } else {
                const updateData = await helpers.auction.updateNFTForBuyNow(
                    payload,
                    buyNftDetail,
                    nftAuctionDetail
                )

                if (updateData) {
                    return res.status(HTTP_STATUS_CODE.OK).send({
                        success: SUCCESS_STATUS.TRUE,
                        message: SUCCESS_MESSAGE.OWNERSHIP_TRANSFERED,
                    })
                }
            }
        } else {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NOT_ON_SALE,
            })
        }
    } catch (error) {
        return next(error)
    }
}

exports.endAuction = async (req, res, next) => {
    try {
        const payload = req.body

        const auctionEndNft = await nftAuctions
            .find({})
            .where('_id', payload.auctionId)
            .populate('nftId')

        const maxBidByAnotherUser =
            await helpers.bid.getPendingHighestBigByAuctionId(payload.auctionId)
        if (
            maxBidByAnotherUser?.length > 0 &&
            auctionEndNft[0]?.nftId?.blockchainType === 'solana'
        ) {
            const data = {
                status: 'winner',
            }
            const updateBid = await helpers.bid.updateBid(
                maxBidByAnotherUser[0]?._id,
                data
            )
        }
        const bid = await Bid.find({
            nftId: ObjectId(auctionEndNft[0]?.nftId?._id),
            bidAmount: auctionEndNft[0]?.highestBid,
        })

        if (bid.length > 0) {
            let bidData = bid[0]
            if (
                auctionEndNft[0]?.nftId?.remainingCopies >
                auctionEndNft[0]?.copiesForAuction
            ) {
                await helpers.auction.createNewNFTforEndAuction(
                    bidData,
                    auctionEndNft[0]
                )
            } else {
                await helpers.auction.updateNFTforEndAuction(
                    bidData,
                    auctionEndNft[0]
                )
            }
        }

        const payloadUpdateAuctionStatus = {
            auctionEnded: true,
            status: 'end',
        }
        await nftAuctions.findByIdAndUpdate(
            { _id: auctionEndNft[0]?._id },
            { $set: payloadUpdateAuctionStatus }
        )
        const payloadUpdateNFT = {
            activeAuction: null,
        }

        await NFT.findByIdAndUpdate(
            { _id: auctionEndNft[0]?.nftId?._id },
            { $set: payloadUpdateNFT }
        )
        if (auctionEndNft[0]?.nftId?.blockchainType !== 'solana') {
            await Bid.deleteMany({ nftId: auctionEndNft[0]?.nftId?._id })
        }
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.AUCTION_ENDED,
        })
    } catch (err) {
        return next(err)
    }
}

exports.cancelList = async (req, res, next) => {
    try {
        const payload = req.body

        const cancelList = await nftAuctions
            .find({})
            .where('_id', payload.auctionId)
            .populate('nftId')

        const updateNFT = await NFT.findByIdAndUpdate(
            { _id: ObjectId(cancelList[0]?.nftId?._id) },
            { $set: { activeAuction: null, currentPrice: 0 } }
        )
        let payloadUpdateAuctionStatus = {
            auctionEnded: true,
            status: 'cancelled',
            sellingMethod: null,
            sellingConfig: null,
            copiesForAuction: null,
            txnHash: req.body?.txnHash,
        }

        if (cancelList[0]?.sellingMethod === 2) {
            payloadUpdateAuctionStatus.auctionStartDate = null
            payloadUpdateAuctionStatus.auctionEndDate = null
        }

        await nftAuctions.findByIdAndUpdate(
            { _id: payload.auctionId },
            { $set: payloadUpdateAuctionStatus }
        )
        await helpers.auction.updateActivityforCancelList(cancelList[0])

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.CANCEL_LIST,
        })
    } catch (err) {
        return next(err)
    }
}
