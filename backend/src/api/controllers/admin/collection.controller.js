const Nfts = require('../../models/nfts.model')
const Collection = require('../../models/collection.model')
const { ObjectId } = require('mongodb')

// API to get collection list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = await Collection.countDocuments({})

        if (page > Math.ceil(total / limit) && total > 0)
            page = Math.ceil(total / limit)

        const collections = await Collection.aggregate([
            {
                $lookup: {
                    from: 'users',
                    foreignField: '_id',
                    localField: 'userId',
                    as: 'user',
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    foreignField: '_id',
                    localField: 'categoryId',
                    as: 'categories',
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    logo: 1,
                    featuredImg: 1,
                    banner: 1,
                    url: 1,
                    description: 1,
                    user: {
                        _id: '$user._id',
                        username: '$user.username',
                        email: '$user.email',
                        profilePhoto: '$user.profilePhoto', // { $ifNull: ['$user.profilePhoto', userDefaultImage] }
                    },
                    category: {
                        $ifNull: [{ $arrayElemAt: ['$categories', 0] }, null],
                    },
                },
            },
        ])

        return res.send({
            success: true,
            message: 'Collections fetched successfully',
            data: {
                collections,
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

// API to get collection
exports.get = async (req, res, next) => {
    try {
        const { collectionId } = req.params

        if (collectionId) {
            const collection = await Collection.aggregate([
                { $match: { _id: ObjectId(collectionId) } },
                {
                    $lookup: {
                        from: 'users',
                        foreignField: '_id',
                        localField: 'userId',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $lookup: {
                        from: 'categories',
                        foreignField: '_id',
                        localField: 'categoryId',
                        as: 'category',
                    },
                },
                {
                    $unwind: '$category',
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        logo: 1,
                        featuredImg: 1,
                        banner: 1,
                        url: 1,
                        description: 1,
                        user: {
                            _id: '$user._id',
                            username: '$user.username',
                            email: '$user.email',
                        },
                        category: {
                            _id: '$category._id',
                            name: '$category.name',
                        },
                    },
                },
            ])

            if (collection.length) {
                let { page, limit } = req.query

                page = page !== undefined && page !== '' ? parseInt(page) : 1
                limit =
                    limit !== undefined && limit !== '' ? parseInt(limit) : 10

                const total = await Nfts.countDocuments({ collectionId })

                if (page > Math.ceil(total / limit) && total > 0)
                    page = Math.ceil(total / limit)

                // find collection NFTs
                const nfts = await Nfts.aggregate([
                    {
                        $match: {
                            collectionId: ObjectId(collectionId),
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
                        $lookup: {
                            from: 'users',
                            foreignField: '_id',
                            localField: 'creatorId',
                            as: 'creator',
                        },
                    },
                    { $sort: { createdAt: -1 } },
                    { $skip: limit * (page - 1) },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            currentPrice: 1,
                            copies: 1,
                            sold: 1,
                            image: 1,
                            status: 1,
                        },
                    },
                ])

                return res.send({
                    success: true,
                    message: 'Collection fetched successfully',
                    data: {
                        collection: collection[0],
                        nfts,
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
            } else {
                return res.status(400).send({
                    success: false,
                    message: 'collection not found for given Id',
                })
            }
        } else {
            return res
                .status(400)
                .send({ success: false, message: 'Collection Id is required' })
        }
    } catch (error) {
        return next(error)
    }
}

// API to delete collection
exports.delete = async (req, res, next) => {
    try {
        const { collectionId } = req.params
        if (collectionId) {
            const collection = await Collection.deleteOne({ _id: collectionId })
            if (collection.deletedCount)
                return res.send({
                    success: true,
                    message: 'Collection deleted successfully',
                    collectionId,
                })
            else
                return res.status(400).send({
                    success: false,
                    message: 'Collection not found for given Id',
                })
        } else
            return res
                .status(400)
                .send({ success: false, message: 'Collection Id is required' })
    } catch (error) {
        return next(error)
    }
}
