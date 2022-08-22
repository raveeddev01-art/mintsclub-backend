const moment = require('moment')
const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const Categories = require('../../models/categories.model')
const { globalImgPlaceholder } = require('../../../config/vars')

// API to get live auctions
exports.live = async (req, res, next) => {
    try {
        let { page, limit, myFilter } = req.query
        let filter, newFilter
        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        let dateTime = new Date(moment().utc(false).toISOString())

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

        if (myFilter && myFilter != 'all') {
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
        const total = await NFT.countDocuments(filter)

        const auctions = await NFT.aggregate([
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
        ])

        return res.send({
            success: true,
            message: 'Live auctions retrieved successfully',
            data: {
                auctions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages:
                        Math.ceil(total / limit) <= 0
                            ? 1
                            : Math.ceil(total / limit),
                },
            },
        })
    } catch (error) {
        return next(error)
    }
}
