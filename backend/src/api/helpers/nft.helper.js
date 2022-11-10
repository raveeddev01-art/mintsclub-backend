const NFT = require('../models/nfts.model')
const Likes = require('../models/likes.model')

const getNftDetailPipeline = async (nftId) => {
    try {
        const pipeline = [
            {
                $match: { _id: nftId },
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'auction',
                    pipeline: [
                        //     {
                        //         // $match: {
                        //         //     $expr: { $eq: ['$auctionEnded', true] },
                        //         // },
                        //     },
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
                    path: '$auction',
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
                    from: 'collections',
                    foreignField: '_id',
                    localField: 'collectionId',
                    as: 'collection',
                },
            },
            {
                $unwind: {
                    path: '$collection',
                },
            },
        ]

        let nftDetail = await NFT.aggregate(pipeline)

        return nftDetail
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const getNftListPipeline = async (
    sortFilters,
    filter,
    limit,
    page,
    total,
    userDefaultImage
) => {
    try {
        const nfts = NFT.aggregate([
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
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    image: 1,
                    description: 1,
                    fileType: 1,
                    copies: 1,
                    currentPrice: 1,
                    collectionId: 1,
                    blockchainType: 1,
                    ownerId: 1,
                    creatorId: 1,
                    userId: 1,
                    remainingCopies: 1,
                    ownerAddress: 1,
                    compressedFile: 1,
                    owner: {
                        _id: '$owner._id',
                        username: '$owner.username',
                        profilePhoto: {
                            $ifNull: ['$owner.profileImage', userDefaultImage],
                        },
                    },
                    auction: {
                        _id: '$auction._id',
                        highestBid: '$auction.highestBid',
                        sellingMethod: '$auction.sellingMethod',
                        copiesForAuction: '$auction.copiesForAuction',
                        sellId: '$auction.sellId',
                        auctionStartDate: '$auction.auctionStartDate',
                        auctionEndDate: '$auction.auctionEndDate',
                        auctionEnded: '$auction.auctionEnded',
                    },
                },
            },
        ])
        const nftLiting = await Promise.all([total, nfts])
        const allNfts = nftLiting[1]
        for (const nft of allNfts) {
            const findCount = await Likes.findOne().where('nftId', nft._id)
            nft.likeCount = 0
            if (findCount) {
                nft.likeCount = findCount.count
            }
        }

        const data = {
            nfts: nftLiting[1],
            pagination: {
                page,
                limit,
                total: nftLiting[0],
                pages:
                    Math.ceil(nftLiting[0] / limit) <= 0
                        ? 1
                        : Math.ceil(nftLiting[0] / limit),
            },
        }

        return data
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

module.exports = {
    getNftDetailPipeline,
    getNftListPipeline,
}
