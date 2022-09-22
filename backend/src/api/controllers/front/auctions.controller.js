const moment = require('moment')
const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const Categories = require('../../models/categories.model')
const nftAuctions = require('../../models/auctions.model')
const Users = require('../../models/users.model')
const Bid = require('../../models/bids.model')
const Collection = require('../../models/collection.model')
const ActivityModal = require('../../models/item-activity.modal')
const NftTokens = require('../../models/nftTokens.model')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
    ERROR_MESSAGE,
} = require('../../../config/constants')

const validation = require('../../middlewares/front/auctionValidation')

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
            }
        } else {
            filter = {
                sellingMethod: 2, // timed auctions only
                auctionStartDate: {
                    $lt: dateTime,
                },
                auctionEndDate: { $gte: dateTime },
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
                    currentPrice: { $first: '$nft.currentPrice' },
                    fileType: { $first: '$nft.fileType' },
                },
            },
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
        payload.sellingConfig = JSON.parse(payload.sellingConfig)
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
            const { error } = validation.validateNFTFixedTAuctionSchema(payload)

            if (error) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: error?.details[0]?.message,
                })
            }
            payload.currentPrice = Number(payload.sellingConfig.price.amount)
        } else {
            const { error } = validation.validateNFTimedTAuctionSchema(payload)

            if (error) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: error?.details[0]?.message,
                })
            }

            payload.currentPrice = Number(
                payload.sellingConfig.startPrice.amount
            )
            const startDate = moment(
                new Date(payload.sellingConfig.duration.startDate)
            )
                .utc(false)
                .toISOString()

            const endDate = moment(
                new Date(payload.sellingConfig.duration.endDate)
            )
                .utc(false)
                .toISOString()

            payload.sellingConfig.duration.startDate = startDate
            payload.sellingConfig.duration.endDate = endDate
            payload.auctionStartDate = startDate
            payload.auctionEndDate = endDate
            // payload.highestBid = payload.sellingConfig.startPrice.amount
            //     ? Number(payload.sellingConfig.startPrice.amount)
            //     : 0
            payload.highestBid = 0
            payload.auctionEnded = false
            payload.bid = []
        }
        const nftAuction = await nftAuctions.create(payload)
        // let price = 0
        // if (Number(payload.sellingMethod) === 1) {
        //     price = payload.sellingConfig.price.amount
        // } else {
        //     price = payload?.sellingConfig?.startPrice?.amount
        // }
        // await NFT.findByIdAndUpdate(
        //     { _id: payload.nftId },
        //     {
        //         $set: {
        //             activeAuction: nftAuction._id,
        //             currentPrice: price,
        //         },
        //     },
        //     { new: true }
        // )
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
        const { error } = validation.validateBuyNowSchema(payload)
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const buyNftDetail = await NFT.findOne({
            _id: payload.nftId,
        })
        const nftAuctionDetail = await nftAuctions.findOne({
            nftId: payload.nftId,
        })

        if (buyNftDetail && nftAuctionDetail?.copiesForAuction > 0) {
            if (
                buyNftDetail.remainingCopies >
                nftAuctionDetail?.copiesForAuction
            ) {
                const newPayload = {
                    ownerId: payload.userId,
                    userId: payload.userId,
                    ownerAddress: payload.ownerAddress,
                    copies: buyNftDetail.copiesForAuction,
                    name: buyNftDetail.name,
                    description: buyNftDetail.description,
                    fileType: buyNftDetail.fileType,
                    creatorId: buyNftDetail.creatorId,
                    collectionId: buyNftDetail.collectionId,
                    categoryId: buyNftDetail.categoryId,
                    currentPrice: buyNftDetail.currentPrice,
                    metaData: buyNftDetail.metaData,
                    image: buyNftDetail.image,
                    remainingCopies: nftAuctionDetail?.copiesForAuction,
                    activeAuction: null,
                }

                const nft = await NFT.create(newPayload)
                if (nft) {
                    let collectionRecord = await Collection.findOne({
                        _id: buyNftDetail.collectionId,
                    })

                    collectionRecord.nft.push(nft._id)
                    collectionRecord.save()
                }

                const nftTokenDetail = await NftTokens.findOne({
                    nftId: payload.nftId,
                })

                const nftTokenPayload = {
                    nftToken: nftTokenDetail.nftToken,
                    nftId: nft._id,
                    tokenStandard: nftTokenDetail.tokenStandard,
                }

                await NftTokens.create(nftTokenPayload)

                const remainingCopies =
                    buyNftDetail.remainingCopies -
                    nftAuctionDetail?.copiesForAuction

                const newPayloadCopies = {
                    remainingCopies: remainingCopies,
                }

                const nftUpdate = await NFT.findByIdAndUpdate(
                    { _id: buyNftDetail._id },
                    { $set: newPayloadCopies }
                )

                if (nftUpdate) {
                    const findUserDetail = await Users.findOne({
                        _id: nftUpdate.ownerId,
                    })

                    const newTotalETH =
                        findUserDetail.totalETH +
                        Number(buyNftDetail.currentPrice)

                    await Users.findByIdAndUpdate(
                        { _id: nftUpdate.ownerId },
                        { $set: { totalETH: newTotalETH } }
                    )

                    await NFT.findByIdAndUpdate(
                        { _id: buyNftDetail._id },
                        { $set: { nftAuction: null } }
                    )
                    return res.status(HTTP_STATUS_CODE.OK).send({
                        success: SUCCESS_STATUS.TRUE,
                        message: SUCCESS_MESSAGE.OWNERSHIP_TRANSFERED,
                    })
                }
            } else {
                const newPayload = {
                    ownerId: payload.userId,
                    ownerAddress: payload.ownerAddress,
                    userId: payload.userId,
                    copies: nftAuctionDetail.copiesForAuction,
                    remainingCopies: nftAuctionDetail.copiesForAuction,
                    activeAuction: null,
                }
                const nftUpdate = await NFT.findByIdAndUpdate(
                    { _id: buyNftDetail._id },
                    { $set: newPayload }
                )

                if (nftUpdate) {
                    const findUserDetail = await Users.findOne({
                        _id: nftUpdate.ownerId,
                    })

                    const newTotalETH =
                        findUserDetail.totalETH +
                        Number(buyNftDetail.currentPrice)

                    await Users.findByIdAndUpdate(
                        { _id: nftUpdate.ownerId },
                        { $set: { totalETH: newTotalETH } }
                    )

                    await NFT.findByIdAndUpdate(
                        { _id: buyNftDetail._id },
                        { $set: { nftAuction: null } }
                    )

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

        const { error } = validation.validateAuctionEndSchema(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const auctionEndNft = await nftAuctions
            .find({})
            .where('_id', payload.auctionId)
            .populate('nftId')

        const bid = await Bid.find({
            nftId: ObjectId(auctionEndNft[0]?.nftId?._id),
            bidAmount: auctionEndNft[0]?.highestBid,
        })
        console.log('bid', bid)
        console.log('auctionEndNft', auctionEndNft)

        if (bid.length > 0) {
            let bidData = bid[0]

            if (
                auctionEndNft[0]?.nftId?.remainingCopies >
                auctionEndNft[0]?.copiesForAuction
            ) {
                let payload = {
                    ownerId: bidData.bidBy,
                    userId: bidData.bidBy,
                    ownerAddress: bidData.fromAddress,
                    copies: auctionEndNft[0]?.copiesForAuction,
                    name: auctionEndNft[0]?.nftId?.name,
                    description: auctionEndNft[0]?.nftId?.description,
                    fileType: auctionEndNft[0]?.nftId?.fileType,
                    creatorId: auctionEndNft[0]?.nftId?.creatorId,
                    collectionId: auctionEndNft[0]?.nftId?.collectionId,
                    categoryId: auctionEndNft[0]?.nftId?.categoryId,
                    currentPrice: bidData[0]?.nftId?.bidAmount,
                    metaData: auctionEndNft[0]?.nftId?.metaData,
                    image: auctionEndNft[0]?.nftId?.image,
                    remainingCopies: auctionEndNft[0]?.copiesForAuction,
                    tokenId: auctionEndNft[0]?.nftId?.tokenId,
                }

                const NFTCreated = await NFT.create(payload)
                console.log('NFTCreated', NFTCreated)
                const auctionPayload = {
                    nftId: NFTCreated?._id,
                    auctionEnded: false,
                    highestBid: 0,
                }

                await nftAuctions.create(auctionPayload)

                const collectionRecord = await Collection.findOne({
                    _id: auctionEndNft[0]?.nftId?.collectionId,
                })

                collectionRecord.nft.push(NFTCreated._id)
                collectionRecord.save()

                const nftTokenDetail = await NftTokens.findOne({
                    nftId: auctionEndNft[0]?.nftId?._id,
                })

                const nftTokenPayload = {
                    nftToken: nftTokenDetail.nftToken,
                    nftId: NFTCreated._id,
                    tokenStandard: nftTokenDetail.tokenStandard,
                }

                await NftTokens.create(nftTokenPayload)

                const remainingCopies =
                    auctionEndNft[0]?.nftId?.remainingCopies -
                    auctionEndNft[0]?.copiesForAuction

                // const newPayload = {
                //     copiesForAuction: 0,
                //     auctionEndDate: null,
                //     auctionStartDate: null,
                //     auctionEnded: false,
                //     sellingMethod: 0,
                //     sellingConfig: {
                //         startPrice: {
                //             currency: null,
                //             amount: 0,
                //         },
                //         duration: {
                //             startTime: null,
                //             endTime: null,
                //         },
                //     },
                // }

                // const aucUpdate = await nftAuctions.findByIdAndUpdate(
                //     { _id: auctionEndNft[0]?._id },
                //     { $set: newPayload }
                // )

                const nftUpdateNewPayload = {
                    remainingCopies: remainingCopies,
                }
                const nftUpdate = await NFT.findByIdAndUpdate(
                    { _id: auctionEndNft[0]?.nftId?._id },
                    { $set: nftUpdateNewPayload }
                )
                if (nftUpdate) {
                    const findUserDetail = await Users.findOne({
                        _id: nftUpdate.ownerId,
                    })

                    let newTotalETH =
                        findUserDetail.totalETH + bidData.bidAmount

                    await Users.findByIdAndUpdate(
                        { _id: nftUpdate.ownerId },
                        { $set: { totalETH: newTotalETH } }
                    )
                }

                await Bid.findByIdAndUpdate(
                    { _id: bidData._id },
                    { $set: { isAccepted: true } }
                )

                const activityPayload = {
                    nftId: auctionEndNft[0]?.nftId?._id,
                    ownerId: auctionEndNft[0]?.nftId?.ownerId,
                    fromAddress: auctionEndNft[0]?.nftId?.ownerAddress,
                    activityType: 'Transfer',
                    toAddress: bidData.fromAddress,
                    price: bidData.bidAmount,
                }

                await ActivityModal.create(activityPayload)
            } else {
                const nftPayload = {
                    ownerId: bidData.bidBy,
                    userId: bidData.bidBy,
                    ownerAddress: bidData.fromAddress,
                    copies: auctionEndNft[0]?.copiesForAuction,
                    remainingCopies: auctionEndNft[0]?.copiesForAuction,
                    currentPrice: auctionEndNft[0]?.highestBid,
                    tokenId: auctionEndNft[0]?.nftId?.tokenId,
                }
                const nftUpdate = await NFT.findByIdAndUpdate(
                    { _id: auctionEndNft[0]?.nft._id },
                    { $set: nftPayload }
                )
                // const aucPayload = {
                //     nftId: auctionEndNft[0]?.nft?._id,
                //     auctionEndDate: null,
                //     auctionStartDate: null,
                //     sellingMethod: 0,
                //     copiesForAuction: 0,
                //     auctionEnded: false,
                //     highestBid: 0,
                //     sellingConfig: {
                //         startPrice: {
                //             currency: null,
                //             amount: 0,
                //         },
                //         duration: {
                //             startTime: null,
                //             endTime: null,
                //         },
                //     },
                // }
                // const aucUpdate = await nftAuctions.findByIdAndUpdate(
                //     { _id: auctionEndNft[0]?.nft._id },
                //     { $set: aucPayload }
                //     // { new: true }
                // )
                if (nftUpdate) {
                    const findUserDetail = await Users.findOne({
                        _id: nftUpdate.ownerId,
                    })

                    let newTotalETH =
                        findUserDetail.totalETH + bidData.bidAmount

                    await Users.findByIdAndUpdate(
                        { _id: nftUpdate.ownerId },
                        { $set: { totalETH: newTotalETH } }
                    )

                    const activityPayload = {
                        nftId: auctionEndNft[0]?.nftId?._id,
                        ownerId: auctionEndNft[0]?.nftId?.ownerId,
                        fromAddress: auctionEndNft[0]?.nftId?.ownerAddress,
                        activityType: 'Transfer',
                        toAddress: bidData.fromAddress,
                        price: bidData.bidAmount,
                    }

                    await ActivityModal.create(activityPayload)
                }
            }
        }
        const payloadUpdateNFT = {
            activeAuction: null,
            // auctionEndDate: null,
            // auctionStartDate: null,
            // sellingMethod: 0,
            // copiesForAuction: 0,
            // auctionEnded: false,
            // sellingConfig: {
            //     startPrice: {
            //         currency: null,
            //         amount: 0,
            //     },
            //     duration: {
            //         startTime: null,
            //         endTime: null,
            //     },
            // },
        }

        await NFT.findByIdAndUpdate(
            { _id: auctionEndNft[0]?.nftId?._id },
            { $set: payloadUpdateNFT }
            // { new: true }
        )
        await Bid.deleteMany({ nftId: auctionEndNft[0]?.nftId?._id })
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.AUCTION_ENDED,
        })
        // }
    } catch (err) {
        return next(err)
    }
}
