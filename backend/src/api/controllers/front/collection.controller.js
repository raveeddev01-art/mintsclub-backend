const fs = require('fs')
const ObjectId = require('mongoose').Types.ObjectId
const NFT = require('../../models/nfts.model')
const Collection = require('../../models/collection.model')
const Categories = require('../../models/categories.model')
const User = require('../../models/users.model')
const validation = require('../../middlewares/front/collectionValidation')
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const {
    compilingPreperations,
    createConfiguration,
    errorHandling,
    writeOutput,
    compileSources,
} = require('../../utils/contractDeployment')
// API to create collection
exports.create = async (req, res, next) => {
    try {
        let payload = {
            userId: req.body.userId,
            categoryId: req.body.categoryId,
            name: req.body.name,
            url: req.body.url,
            description: req.body.description,
            ownerAddress: req.body.ownerAddress,
            deploy: req.body.deploy ? req.body.deploy : false,
            abi: req.body.abi ? req.body.abi : null,
            contractAddress: req.body.contractAddress
                ? req.body.contractAddress
                : '',
            blockchainType: req.body.blockchainType,
        }
        const { error } = validation.validateCollectionSchema(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        payload = {
            ...payload,
            logo: req.body.logo,
            featuredImg: req.body.featuredImg,
            banner: req.body.bannerUrl,
        }

        payload.categoryId = payload.categoryId ? payload.categoryId : null

        if (!payload?.logo) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.LOGO_REQUIRED,
            })
        }

        const existingCollection = await Collection.findOne({
            name: new RegExp(payload.name, 'gi'),
            userId: payload.userId,
        })

        if (existingCollection) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.COLLECTION_EXIST_ALREADY,
            })
        }
        const collection = await Collection.create(payload)
        return res.status(HTTP_STATUS_CODE.CREATED).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.COLLECTION_CREATED,
            collection,
        })
    } catch (error) {
        return next(error)
    }
}

// API to edit collection
exports.edit = async (req, res, next) => {
    try {
        let payload = {
            userId: req.body.userId,
            _id: req.body._id,
            categoryId: req.body.categoryId,
            name: req.body.name,
            url: req.body.url,
            description: req.body.description,
        }
        console.log(payload, 'payload in edit collection')

        const { error } = validation.validateEditCollectionSchema(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        payload = {
            ...payload,
            logo: req.body.logo,
            featuredImg: req.body.featuredImgUrl,
            banner: req.body.bannerUrl,
        }
        payload.categoryId = payload.categoryId ? payload.categoryId : null

        if (!payload?.logo) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.LOGO_REQUIRED,
            })
        }

        if (payload.name) {
            const existingCollection = await Collection.findOne({
                _id: { $ne: payload._id },
                name: new RegExp(payload.name, 'gi'),
                userId: payload.userId,
            })
            if (existingCollection)
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: ERROR_MESSAGE.COLLECTION_EXIST_ALREADY,
                })
        }

        const collection = await Collection.findByIdAndUpdate(
            { _id: payload._id },
            { $set: payload },
            { new: true }
        )
        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.COLLECTION_UPDATED,
            collection,
        })
    } catch (error) {
        return next(error)
    }
}

// API to delete collection
exports.delete = async (req, res, next) => {
    try {
        const { collectionId } = req.params
        console.log(collectionId, 'collecctionId==>')

        const { error } = validation.validateCollectionId({ collectionId })

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const collection = await Collection.deleteOne({ _id: collectionId })
        if (collection.deletedCount)
            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.COLLECTION_DELETED,
                collectionId,
            })
        else
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.COLLECTION_NOT_FOUND,
            })
    } catch (error) {
        return next(error)
    }
}

// API to get collection
exports.get = async (req, res, next) => {
    try {
        const { collectionId } = req.params
        const { error } = validation.validateCollectionId({ collectionId })
        console.log(collectionId, 'collectionId==>')
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        let collection = await Collection.findOne({ _id: collectionId })
            .populate([
                {
                    path: 'userId',
                    select: '_id username email profilePhoto',
                },
                { path: 'categoryId', select: '_id name image' },
            ])
            .lean(true)
        if (collection) {
            collection.items = await NFT.countDocuments({ collectionId })

            let owners = await NFT.find({ collectionId }).distinct(
                'collectionId'
            )
            collection.owners = owners?.length || 0

            return res.json({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.COLLECTION_FETCHED,
                collection,
            })
        } else
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.COLLECTION_NOT_FOUND,
            })
    } catch (error) {
        return next(error)
    }
}

// API to get collection list
exports.list = async (req, res, next) => {
    try {
        let { page, limit, myFilter, all } = req.query
        
        let filter = {}

        if (myFilter) {
            const applyFilter = await Categories.findOne({}, '_id').where(
                'description',
                myFilter
            )
            if (!applyFilter) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: ERROR_MESSAGE.INVALID_FILTER_PASSED,
                })
            }
            filter = { categoryId: applyFilter._id }
        }

        if (myFilter && myFilter === 'all') {
            filter = {}
        }

        let total = 0

        if (!all) {
            page = page !== undefined && page !== '' ? parseInt(page) : 1
            // limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10
            total = await Collection.countDocuments({})
            limit = limit !== undefined && limit !== '' ? parseInt(limit) : total

            // total = await Collection.countDocuments({})
            

            if (page > Math.ceil(total / limit) && total > 0)
                page = Math.ceil(total / limit)
        }

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

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.COLLECTIONS_FETCHED,
            data: {
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
            },
        })
    } catch (error) {
        return next(error)
    }
}

// API to get my collections list
exports.myCollectionList = async (req, res, next) => {
    try {
        let { userId, page, limit } = req.query

        if (!userId)
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGN_IN_FIRST,
            })

        const findUser = await User.findOne({ _id: userId })

        if (findUser) {
            let total = 0

            page = page !== undefined && page !== '' ? parseInt(page) : 1
            limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

            total = Collection.find({}).where('userId', userId)

            const pipeline = [
                {
                    $match: { userId: ObjectId(userId) },
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
                        ownerAddress:{$first: '$ownerAddress'},
                        username: { $first: '$user.username' },
                        profileImage: { $first: '$user.profileImage' },
                        blockchainType: { $first: '$blockchainType' },
                    },
                },
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

            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.MY_COLLECTIONS_FETCHED,
                data: {
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
                },
            })
        }
        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.USER_ID_NOT_FOUND,
        })
    } catch (error) {
        return next(error)
    }
}

exports.popular = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const { myFilter } = req.query
        let filter = {}

        if (myFilter) {
            const applyFilter = await Categories.findOne({}, '_id').where(
                'description',
                myFilter
            )
            if (!applyFilter) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: ERROR_MESSAGE.INVALID_FILTER_PASSED,
                })
            }

            filter = { categoryId: applyFilter._id }
        }

        if (myFilter && myFilter === 'all') {
            filter = {}
        }

        let total = 0

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        total = Collection.countDocuments({})

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

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.POPULAR_COLLECTIONS_FETCHED,
            data: {
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
            },
        })
    } catch (error) {
        return next(error)
    }
}

exports.deploy = async (req, res, next) => {
    try {
        let payload = {}
        const { abi, bytecode, buildFile } = this.getAbi()
        payload.abi = abi
        payload.bytecode = bytecode
        if (payload?.abi) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.ABI_CREATED,
                data: payload,
            })
        }
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.WENT_WRONG,
        })
    } catch (error) {
        return next(error)
    }
}

exports.getAbi = () => {
    const buildPath = compilingPreperations()
    const config = createConfiguration()
    const compiled = compileSources(config)
    errorHandling(compiled)
    return writeOutput(compiled, buildPath)
}
