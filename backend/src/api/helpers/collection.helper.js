const Collection = require('../models/collection.model')

const collectionListPipeline = async (filter, all, limit, page) => {
    try {
        const pipeline = [
            {
                $match: filter,
            },
            { $sort: { name: 1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nft',
                    foreignField: '_id',
                    as: 'totalnft',
                },
            },
            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nft',
                    foreignField: '_id',
                    as: 'nfts',
                    pipeline: [
                        { $match: { $expr: { $eq: ['$fileType', 'image'] } } },
                        { $limit: 3 },
                    ],
                },
            },
            {
                $addFields: {
                    NftsCount: { $size: '$totalnft' },
                },
            },

            {
                $unwind: {
                    path: '$nfts',
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $group: {
                    _id: '$_id',
                    nftDetail: {
                        $push: {
                            image: '$nfts.image',
                            fileType: '$nfts.fileType',
                        },
                    },
                    TotalNfts: { $first: '$NftsCount' },
                    userId: { $first: '$userId' },
                    categoryId: { $first: '$categoryId' },
                    name: { $first: '$name' },
                    description: { $first: '$description' },
                    blockchainType: { $first: '$blockchainType' },
                    logo: { $first: '$logo' },
                    featuredImg: { $first: '$featuredImg' },
                    ownerAddress: { $first: '$ownerAddress' },
                    banner: { $first: '$banner' },
                    username: { $first: '$user.username' },
                    profileImage: { $first: '$user.profileImage' },
                    createdAt: { $first: '$createdAt' },
                    contractAddress: { $first: '$contractAddress' },
                    isApproved: { $first: '$isApproved' },
                },
            },
            { $sort: { createdAt: -1 } },
        ]

        const newTotal = await Collection.aggregate(pipeline)

        const totalRecords = newTotal.length

        if (!all) {
            pipeline.push({ $skip: limit * (page - 1) })
            pipeline.push({ $limit: limit })
        }

        const collections = await Collection.aggregate(pipeline)
        const data = {
            collections,
            pagination: {
                page,
                limit,
                totalRecords,
                pages:
                    Math.ceil(totalRecords / limit) <= 0
                        ? 1
                        : Math.ceil(totalRecords / limit),
            },
        }
        return data
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const collectionListByUserId = async (total, userId, limit, page) => {
    try {
        const pipeline = [
            {
                $match: { userId },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $lookup: {
                    from: 'nfts',
                    foreignField: '_id',
                    localField: 'nft',
                    as: 'nfts',
                },
            },
            {
                $unwind: {
                    path: '$nfts',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: '$_id',
                    nftDetail: {
                        $push: {
                            image: '$nfts.image',
                            fileType: '$nfts.fileType',
                        },
                    },
                    userId: { $first: '$userId' },
                    categoryId: { $first: '$categoryId' },
                    name: { $first: '$name' },
                    description: { $first: '$description' },
                    logo: { $first: '$logo' },
                    featuredImg: { $first: '$featuredImg' },
                    banner: { $first: '$banner' },
                    ownerAddress: { $first: '$ownerAddress' },
                    username: { $first: '$user.username' },
                    profileImage: { $first: '$user.profileImage' },
                    blockchainType: { $first: '$blockchainType' },
                    createdAt: { $first: '$createdAt' },
                    contractAddress: { $first: '$contractAddress' },
                    isApproved: { $first: '$isApproved' },
                },
            },
            { $sort: { createdAt: -1 } },
        ]

        const newTotal = Collection.aggregate(pipeline)
        const collectionList = await Promise.all([total, newTotal])

        if (
            page > Math.ceil(collectionList[0] / limit) &&
            collectionList[0] > 0
        )
            page = Math.ceil(collectionList[0] / limit)

        const totalRecords = collectionList[1]?.length

        pipeline.push({ $skip: limit * (page - 1) })
        pipeline.push({ $limit: limit })

        const Collections = await Collection.aggregate(pipeline)

        const data = {
            collections: {
                totalRecords,
                Collections,
            },
            pagination: {
                page,
                limit,
                totalRecords,
                pages:
                    Math.ceil(totalRecords / limit) <= 0
                        ? 1
                        : Math.ceil(totalRecords / limit),
            },
        }

        return data
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const collectionListPopular = async (filter, total, limit, page) => {
    try {
        const pipeline = [
            {
                $match: filter,
            },
            {
                $lookup: {
                    from: 'likesschemas',
                    foreignField: 'nftId',
                    localField: 'nft',
                    as: 'likesschemas',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                },
            },

            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nft',
                    foreignField: '_id',
                    as: 'totalnft',
                },
            },

            {
                $lookup: {
                    from: 'nfts',
                    foreignField: '_id',
                    localField: 'nft',
                    as: 'nft',
                    pipeline: [
                        { $match: { $expr: { $eq: ['$fileType', 'image'] } } },
                        { $limit: 3 },
                    ],
                },
            },

            {
                $addFields: {
                    NftsCount: { $size: '$totalnft' },
                },
            },

            {
                $unwind: {
                    path: '$nft',
                    preserveNullAndEmptyArrays: true,
                },
            },

            {
                $group: {
                    _id: '$_id',
                    likesCount: { $first: '$likesschemas.count' },
                    nftDetail: {
                        $push: {
                            image: '$nft.image',
                            fileType: '$nft.fileType',
                        },
                    },
                    TotalNfts: { $first: '$NftsCount' },
                    userId: { $first: '$userId' },
                    categoryId: { $first: '$categoryId' },
                    name: { $first: '$name' },
                    description: { $first: '$description' },
                    logo: { $first: '$logo' },
                    featuredImg: { $first: '$featuredImg' },
                    banner: { $first: '$banner' },
                    ownerAddress: { $first: '$ownerAddress' },
                    soldCopies: {
                        $push: {
                            $subtract: ['$nft.copies', '$nft.remainingCopies'],
                        },
                    },
                    username: { $first: '$user.username' },
                    profileImage: { $first: '$user.profileImage' },
                },
            },
            { $sort: { _id: 1 } },
        ]

        const newTotal = Collection.aggregate(pipeline)

        const popularCollections = await Promise.all([total, newTotal])
        if (
            page > Math.ceil(popularCollections[0] / limit) &&
            popularCollections[0] > 0
        )
            page = Math.ceil(popularCollections[0] / limit)

        const totalRecords = popularCollections[1]?.length

        pipeline.push({ $skip: limit * (page - 1) })
        pipeline.push({ $limit: limit })

        const collectionsList = await Collection.aggregate(pipeline)
        const data = {
            collectionsList,
            pagination: {
                page,
                limit,
                totalRecords,
                pages:
                    Math.ceil(totalRecords / limit) <= 0
                        ? 1
                        : Math.ceil(totalRecords / limit),
            },
        }
        return data
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

module.exports = {
    collectionListPipeline,
    collectionListByUserId,
    collectionListPopular,
}
