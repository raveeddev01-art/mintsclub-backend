const fs = require('fs')
const Collection = require('../../models/collection.model')
const NFT = require('../../models/nfts.model')
const NFTAuction = require('../../models/auctions.model')
const NftTokens = require('../../models/nftTokens.model')
const { addImage, addContent } = require('../../utils/upload')
const ObjectId = require('mongoose').Types.ObjectId
const validation = require('../../middlewares/front/nftValidation')
const Likes = require('../../models/likes.model')
const { userDefaultImage } = require('../../../config/vars')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

// API to create NFT
exports.create = async (req, res, next) => {
    try {
        const payload = {
            name: req.body.name,
            description: req.body.description,
            properties: JSON.parse(req.body.properties),
            levels: JSON.parse(req.body.levels),
            stats: JSON.parse(req.body.stats),
            fileType: req.body.fileType,
            ownerId: req.body.ownerId,
            userId: req.body.userId,
            collectionId: req.body.collectionId,
            categoryId: req.body.categoryId,
            currentPrice: 0,
            ownerAddress: req.body.ownerAddress,
            copies: req.body.copies,
            activeAuction: req.body.activeAuction,
        }

        const { error } = validation.validateNFTSchema(payload)
        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        if (req.files && req.files.image) {
            const image = req.files.image[0]
            const imgData = fs.readFileSync(image.path)
            payload.image = await addImage(imgData)
        }

        if (!payload.image) {
            return res.send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.IMAGE_REQUIRED,
            })
        }

        const payloadProperties = {
            properties: payload.properties,
            levels: payload.levels,
            stats: payload.stats,
        }

        payload.metaData = await addContent({
            name: payload.name,
            description: payload.description,
            image: payload.image,
            properties: payloadProperties,
            nftOwnerId: payload.ownerId,
            ownerAddress: payload.ownerAddress,
        })

        payload.creatorId = payload.userId
        payload.remainingCopies = payload.copies

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.DATA_UPLOADED,
            nft: payload,
        })
    } catch (error) {
        return next(error)
    }
}

exports.storeDataInDb = async (req, res, next) => {
    try {
        //create nft
        if (!req.body.data) {
            return res.send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.PROVIDE_DATA,
            })
        }

        const createNFTPayload = req.body.data
        createNFTPayload.image = req.body.image
        createNFTPayload.tokenId = Number(req.body.nftToken)
        createNFTPayload.lazyMinted = req.body.lazyMinted

        const nft = await NFT.create(createNFTPayload)

        return res.status(HTTP_STATUS_CODE.CREATED).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_CREATED,
            nft,
        })
    } catch (error) {
        return next(error)
    }
}

// API to get a NFT
exports.get = async (req, res, next) => {
    try {
        const { nftId } = req.params
        const payload = {
            nftId: nftId,
        }

        const { error } = validation.validateNftId(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const pipeline = [
            {
                $match: { _id: ObjectId(payload.nftId) },
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'auction',
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
        nftDetail = nftDetail[0]
        if (!nftDetail) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: SUCCESS_MESSAGE.NO_DATA_FOUND,
            })
        }

        const tokenData = NftTokens.findOne({ nftId: payload.nftId })

        const nftLikes = Likes.findOne({ nftId: payload.nftId })

        const returnData = JSON.parse(JSON.stringify(nftDetail))

        const lowestInCollection = NFT.find({
            collectionId: nftDetail.collectionId,
        })
            .sort({ currentPrice: 1 })
            .limit(1)

        const nftList = await Promise.all([
            tokenData,
            nftLikes,
            lowestInCollection,
        ])

        if (nftList[2]) {
            returnData.lowestNftPrice = nftList[2][0]['currentPrice']
        }

        if (nftList[0]) {
            returnData.nftToken = nftList[0]['nftToken']
        }

        returnData.likesCount = 0
        if (nftList[1]) {
            returnData.likesCount = nftList[1]['count']
        }

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_FETCHED,
            data: returnData,
        })
    } catch (error) {
        return next(error)
    }
}

// API to get NFTs list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const {
            collectionId,
            gtePrice,
            ltePrice,
            categoryId,
            oldest,
            lowToHigh,
            newest,
            highToLow,
            ownerId,
            buy,
            auction,
            latest,
            keyword,
        } = req.query

        const ownerId1 = ObjectId(ownerId)
        let search
        if (keyword) {
            search = true
        }

        const filter = {
            status: { $ne: 0 },
            ...(latest && {
                createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            ...(ownerId && { ownerId: ownerId1 }),
            ...(gtePrice && {
                currentPrice: {
                    $gte: Number(gtePrice),
                    $lte: Number(ltePrice),
                },
            }),
            ...(collectionId && { collectionId }),
            ...(categoryId && { categoryId }),
            ...(buy && { 'auction.sellingMethod': { $eq: 1 } }),
            ...(auction && { 'auction.sellingMethod': { $eq: 2 } }),
            ...(search && {
                $or: [
                    { name: { $regex: '.*' + keyword + '.*', $options: 'i' } },
                    {
                        description: {
                            $regex: '.*' + keyword + '.*',
                            $options: 'i',
                        },
                    },
                    { ownerAddress: { $regex: keyword, $options: 'i' } },
                ],
            }),
        }

        if (collectionId) filter.collectionId = ObjectId(collectionId)

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = NFT.countDocuments(filter)

        const nfts = NFT.aggregate([
            {
                $sort: {
                    ...(newest && { createdAt: -1 }),
                    ...(oldest && { createdAt: 1 }),
                    ...(lowToHigh && { currentPrice: 1 }),
                    ...(highToLow && { currentPrice: -1 }),
                    name: 1,
                },
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'auction',
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
                    ownerId: 1,
                    creatorId: 1,
                    userId: 1,
                    remainingCopies: 1,
                    ownerAddress: 1,
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

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFTs_FETCHED,
            data: {
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
            },
        })
    } catch (error) {
        return next(error)
    }
}

exports.editNft = async (req, res, next) => {
    try {
        const filter = { _id: req.body.nftOwnerId }
        const update = {
            nftOwnerId: req.body.currentUserId,
        }
        const updatedNft = await NFT.findOneAndUpdate(filter, update, {
            new: true,
        })
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_UPDATED,
            data: updatedNft,
        })
    } catch (err) {
        return next(err)
    }
}

exports.updateNft = async (req, res, next) => {
    try {
        const payload = {
            nftId: req.body.nftId,
            name: req.body.name,
            description: req.body.description,
            attributes: JSON.parse(req.body.attributes),
            levels: JSON.parse(req.body.levels),
            stats: JSON.parse(req.body.stats),
            fileType: req.body.fileType,
            userId: req.body.userId,
            ownerAddress: req.body.ownerAddress,
            collectionId: req.body.collectionId,
            currentPrice: req.body.currentPrice,
            copies: req.body.copies,
        }
        const { error } = validation.validateEditNftSchema(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        if (req.files && req.files.image) {
            const image = req.files.image[0]
            const imgData = fs.readFileSync(image.path)
            payload.image = await addImage(imgData)
        }

        if (!payload.image) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.IMAGE_REQUIRED,
            })
        }
        const ownerId = payload.userId

        // let payloadProperties = {
        //   attributes: payload.attributes,
        //   levels: payload.levels,
        //   stats: payload.stats,
        // };

        payload.metaData = await addContent({
            name: payload.name,
            description: payload.description,
            image: payload.image,
            // properties: payloadProperties,
            nftOwnerId: ownerId,
            ownerAddress: payload.ownerAddress,
        })

        const updateNft = await NFT.findByIdAndUpdate(
            { _id: payload.nftId },
            { $set: payload },
            { new: true }
        )

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_UPDATED,
            data: updateNft,
        })
    } catch (err) {
        return next(err)
    }
}

exports.getNFTsbyCollection = async (req, res) => {
    try {
        const collectionId = req.body.collectionId
        const NFTs = await NFT.aggregate([
            {
                $match: { collectionId: ObjectId(collectionId) },
            },
            {
                $lookup: {
                    from: 'auctions',
                    foreignField: 'nftId',
                    localField: '_id',
                    as: 'auction',
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
        ])
        for (const nft of NFTs) {
            const findCount = await Likes.findOne().where('nftId', nft._id)
            nft.likeCount = 0
            if (findCount) {
                nft.likeCount = findCount.count
            }
        }
        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFTS_BY_COLLECTION,
            data: NFTs,
        })
    } catch (err) {
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            error: err,
        })
    }
}

// API to delete nft
exports.delete = async (req, res, next) => {
    try {
        const { nftId } = req.params

        const { error } = validation.validateNftId({ nftId })

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        const nftDetail = NFT.find({ _id: nftId })
        const nft = NFT.deleteOne({ _id: nftId })
        const nftDelete = await Promise.all([nftDetail, nft])
        if (nftDelete[1]?.deletedCount) {
            const nftToken = await NftTokens.deleteOne({ nftId: nftId })
            await NFTAuction.deleteOne({ nftId: nftId })
            const updateCollection = await Collection.updateOne(
                { _id: nftDelete[0][0]['collectionId'] },
                { $pull: { nft: nftId } }
            )

            if (nftToken && updateCollection) {
                return res.status(HTTP_STATUS_CODE.OK).send({
                    success: SUCCESS_STATUS.TRUE,
                    message: SUCCESS_MESSAGE.NFT_DELETED,
                })
            }
        }
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.NO_DATA_FOUND,
        })
    } catch (error) {
        return next(error)
    }
}

// API to get user NFTs listing
exports.myNftListing = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const { userId } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        if (!userId)
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.SIGN_IN_FIRST,
            })

        const myNfts = await NFT.find({})
            .where('userId', userId)
            .populate('collectionId', 'name')

        if (myNfts.length === 0) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NO_NFT_FOUND,
            })
        }

        const data = {}

        data.totalRecords = myNfts.length

        if (endIndex < myNfts.length) {
            data.next = {
                page: page + 1,
                limit: limit,
            }
        }
        if (startIndex > 0) {
            data.previous = {
                page: page - 1,
                limit: limit,
            }
        }
        data.NFTs = myNfts.slice(startIndex, endIndex)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.MY_NFTS_FETCHED,
            data,
        })
    } catch (error) {
        return next(error)
    }
}
