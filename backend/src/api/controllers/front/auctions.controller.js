const moment = require('moment')
const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const Categories = require('../../models/categories.model')
const { globalImgPlaceholder } = require('../../../config/vars')
const { SUCCESS_MESSAGE, SUCCESS_STATUS } = require('../../../config/constants')
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
                categoryId: ObjectId(newFilter),
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
        const pipeline = [
            {
                $match: filter,
            },
            {
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'ownerId',
                    as: 'owner',
                },
            },
            {
                $unwind: {
                    path: '$owner',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'bids',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'bids',
                },
            },

            { $sort: { createdAt: -1 } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    copies: 1,
                    currentPrice: 1,
                    auctionEndDate: 1,
                    fileType: 1,
                    ownerId: 1,
                    highestBid: 1,
                    ownerAddress: 1,
                    owner: {
                        _id: '$owner._id',
                        username: '$owner.username',
                        profilePhoto: {
                            $ifNull: [
                                '$owner.profileImage',
                                globalImgPlaceholder,
                            ],
                        },
                    },
                    bidInfo: {
                        bidBy: '$bids.bidBy',
                        bidByProfile: '$bids.bidByProfile',
                    },
                },
            },
        ]

        const total = NFT.countDocuments(filter)

        const auctions = NFT.aggregate(pipeline)

        const auctionList = await Promise.all([total, auctions])

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.LIVE_AUCTIONS,
            data: {
                auctions: auctionList[1],
                pagination: {
                    page,
                    limit,
                    total: auctionList[0],
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
