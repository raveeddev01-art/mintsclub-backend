const moment = require('moment')
const mongoose = require('mongoose')
const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const Categories = require('../../models/categories.model')
const nftAuctions = require('../../models/auctions.model')
const Bid = require('../../models/bids.model')
const helpers = require('../../helpers')
const socket = require('../../../utils/socket')

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

        filter = {
            sellingMethod: 2, // timed auctions only
            auctionStartDate: {
                $lt: dateTime,
            },
            auctionEndDate: { $gte: dateTime },
            auctionEnded: false,
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
            {
                $match: {
                    ...(myFilter === 'all'
                        ? {}
                        : {
                              'nft.categoryId':
                                  mongoose.Types.ObjectId(newFilter),
                          }),
                },
            },
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
                    blockchainType: { $first: '$nft.blockchainType' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },
            { $sort: { updatedAt: -1 } },
            {
                $facet: {
                    metadata: [
                        { $count: 'total' },
                        { $addFields: { page } },
                        { $addFields: { limit } },
                    ],
                    data: [{ $skip: limit * (page - 1) }, { $limit: limit }],
                },
            },
            { $sort: { createdAt: -1 } },
        ]

        const auctionsResponse = await nftAuctions.aggregate(pipeline)

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.LIVE_AUCTIONS,
            data: {
                auctions: auctionsResponse[0]?.data,
                pagination: {
                    ...auctionsResponse[0].metadata[0],
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
            status: 'active',
        })
        await NFT.findByIdAndUpdate(
            { _id: payload.nftId },
            { $set: { isSold: true } },
            { new: true }
        )

        //in lazy minting case
        if (req.body?.tokenId) {
            await NFT.findByIdAndUpdate(
                { _id: payload.nftId },
                { $set: { tokenId: req.body.tokenId } },
                { new: true }
            )
        }
        if (req.body?.mint) {
            const updateMintAndMetadata = {
                mint: req.body.mint,
                metaData: req.body.metaData,
            }
            await NFT.findByIdAndUpdate(
                { _id: payload.nftId },
                { $set: updateMintAndMetadata },
                { new: true },
            )
        }
        if (req.body?.assetId) {
            const updateMintAndMetadata = {
                tokenId: req.body.assetId,
                metaData: req.body.metaData,
            }
            await NFT.findByIdAndUpdate(
                { _id: payload.nftId },
                { $set: updateMintAndMetadata },
                { new: true }
            )
        }
        let copiesCondition = true
        if (
            buyNftDetail?.blockchainType !== 'solana' &&
            buyNftDetail?.blockchainType !== 'algorand'
        ) {
            copiesCondition =
                nftAuctionDetail?.copiesForAuction > 0 ? true : false
        }
        if (buyNftDetail && copiesCondition) {
            if (
                buyNftDetail.remainingCopies >
                    nftAuctionDetail?.copiesForAuction &&
                buyNftDetail?.blockchainType !== 'solana' &&
                buyNftDetail?.blockchainType !== 'algorand'
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
            auctionId: ObjectId(auctionEndNft[0]?._id),
            bidAmount: auctionEndNft[0]?.highestBid,
        }).sort({ bidAmount: -1 })

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
        const auctionDetail = await nftAuctions.findOneAndUpdate(
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

        socket.io.to(`${auctionDetail?.nftId}`).emit('auctionUpdated', {
            nftId: auctionDetail?.nftId,
            userId: auctionDetail?.userId,
        })
        if (auctionEndNft[0].nftId.blockchainType !== 'solana') {
            res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.AUCTION_ENDED_SUCCESSFULLY,
            })
        } else {
            res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.AUCTION_ENDED,
            })
        }
        // Socket to Remove NFT from Profile
        socket.io.to(`${auctionDetail?.nftId}`).emit('auctionUpdated', {
            nftId: auctionDetail?.nftId,
            userId: auctionDetail?.userId,
        })
        socket.io.to(`${auctionDetail?.nftId}`).emit('auctionEnded', {
            nftId: auctionDetail?.nftId,
            // userId: auctionDetail?.userId,
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

        // Sending Event for get list of auction on nft details page.
        socket.io.to(`${cancelList[0]?.nftId?._id}`).emit('auctionCancelled', {
            auctionId: payload?.auctionId,
            nftId: cancelList[0]?.nftId?._id,
        })

        // Sending Event for get list of auction on page 1
        socket.io.emit('auctionUpdated', {
            auctionId: payload?.auctionId,
            nftId: cancelList[0]?.nftId?._id,
        })

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.CANCEL_LIST,
        })
    } catch (err) {
        return next(err)
    }
}
