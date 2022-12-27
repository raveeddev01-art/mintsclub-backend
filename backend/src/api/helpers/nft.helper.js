const NFT = require('../models/nfts.model')
const Likes = require('../models/likes.model')

const getNftDetailPipeline = async (nftId, blockChainType) => {
    try {
        let auctionEndFilter = {}
        if (blockChainType !== 'solana' && blockChainType !== 'algorand') {
            auctionEndFilter = {
                $expr: { $ne: ['$auctionEnded', true] },
            }
        }

        const pipeline = [
            {
                $match: { _id: nftId },
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: '_id',
                    localField: 'activeAuction',
                    as: 'activeAuction',
                    pipeline: [
                        {
                            $match: auctionEndFilter,
                        },
                        {
                            $sort: {
                                createdAt: -1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$activeAuction',
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
                },
            },
            {
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'creatorId',
                    as: 'creator',
                },
            },
            {
                $unwind: {
                    path: '$creator',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'collections',
                    foreignField: '_id',
                    localField: 'collectionId',
                    as: 'collection',
                },
            },
            {
                $unwind: {
                    path: '$collection',
                    preserveNullAndEmptyArrays: true,
                },
            },
        ]

        let nftDetail = await NFT.aggregate(pipeline)

        return nftDetail
    } catch (error) {
        console.log('NFT aggregate error', error)
        // return error
    }
}

const getNftListPipeline = async (
    sortFilters,
    filter,
    limit,
    page,
    userDefaultImage
) => {
    try {
        const nfts = await NFT.aggregate([
            {
                $sort: sortFilters,
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'auction',
                    pipeline: [
                        {
                            $match: {
                                // $expr: { $ne: ['$status', 'cancelled'] },
                                status: { $nin: ['cancelled', 'end'] },
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$auction',
                    preserveNullAndEmptyArrays: true,
                },
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
            { $match: filter },

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
        ])
        return {
            nfts: nfts[0]?.data,
            pagination: {
                ...nfts[0]?.metadata[0],
            },
        }
    } catch (error) {
        console.log('error', error)
    }
}

module.exports = {
    getNftDetailPipeline,
    getNftListPipeline,
}
