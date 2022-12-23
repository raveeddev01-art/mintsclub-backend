const fs = require('fs')
const moment = require('moment')
const Collection = require('../../models/collection.model')
const NFT = require('../../models/nfts.model')
const NFTAuction = require('../../models/auctions.model')
const NftTokens = require('../../models/nftTokens.model')
const { addImage, addContent } = require('../../utils/upload')
const ObjectId = require('mongoose').Types.ObjectId
const Likes = require('../../models/likes.model')
const { userDefaultImage, pinataJWT } = require('../../../config/vars')
const helpers = require('../../helpers')
const { pinFileToIPFS, uploadJsonToIpfs } = require('../../utils/ipfs')

const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

// API to create NFT
exports.create = async (req, res, next) => {
    try {
        let payload = {
            name: req.body.name,
            // blockchainType: req.body.blockchainType,
            
        }
        const existingNFT = await NFT.findOne({
            name:payload.name,
            blockchainType:payload.blockchainType,
        })

        if (existingNFT) {
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.NFT_EXIST_ALREADY,
            })
        }
        let result = null

        if (req.files?.image) {
            result = await pinFileToIPFS(req.files, req.body)
        } else {
            result = await uploadJsonToIpfs(req.body.image, req.body)
        }
        return res.status(HTTP_STATUS_CODE.CREATED).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_CREATED,
            data: result,
        })
    } catch (err) {
        return next(err)
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
        createNFTPayload.properties = JSON.parse(req.body.data.properties)
        createNFTPayload.levels = JSON.parse(req.body.data.levels)
        createNFTPayload.stats = JSON.parse(req.body.data.stats)
        if (req.body?.algoLazyMinted) {
            createNFTPayload.algoLazyMinted = req.body.algoLazyMinted
        }

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
        let payload = {
            nftId,
        }
        payload.nftId = ObjectId(payload.nftId)
        const getNft = await NFT.find({ _id: payload.nftId })
        let nftDetail = await helpers.nft.getNftDetailPipeline(
            payload.nftId,
            getNft[0]?.blockchainType
        )
        console.log('nft details ======', nftDetail)
        nftDetail = nftDetail[0]

        if (!nftDetail) {
            console.log('nft detail success ====== false');

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
        console.log('nft detail fetch error =========', error);
        return next(error)
    }
}

// API to get NFTs list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const dateTime = new Date(moment().utc(false).toISOString())
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
            created,
            collected,
            // favourite,
            userOwned,
        } = req.query

        let search
        if (keyword) {
            search = true
        }

        const filter = {
            // status: { $ne: 0 },
            ...(latest && {
                createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            }),
            ...(ownerId && { ownerId: ObjectId(ownerId) }),
            ...(gtePrice && {
                currentPrice: {
                    $gte: Number(gtePrice),
                    $lte: Number(ltePrice),
                },
            }),
            ...(collectionId && { collectionId }),
            ...(categoryId && { categoryId }),
            ...(buy && {
                $and: [
                    { 'auction.sellingMethod': { $eq: 1 } },
                    { 'auction.auctionEnded': false },
                ],
            }),
            ...(auction && {
                $and: [
                    { 'auction.sellingMethod': { $eq: 2 } },
                    {
                        'auction.auctionStartDate': {
                            $lt: dateTime,
                        },
                    },
                    {
                        'auction.auctionEndDate': {
                            $gte: dateTime,
                        },
                    },
                    { 'auction.auctionEnded': false },
                ],
            }),
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
            ...(created && {
                creatorId: ObjectId(created),
            }),
            ...(collected && {
                creatorId: { $ne: ObjectId(collected) },
                ownerId: ObjectId(collected),
            }),
            ...(userOwned && {
                ownerId: ObjectId(userOwned),
            }),
            // ...(favourite &&{
            //     userId: ObjectId(favourite)
            // })
        }

        if (collectionId) filter.collectionId = ObjectId(collectionId)

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = await NFT.countDocuments(filter)

        let sortFilters = {
            ...(newest && { createdAt: -1 }),
            ...(oldest && { createdAt: 1 }),
            ...(lowToHigh && { currentPrice: 1 }),
            ...(highToLow && { currentPrice: -1 }),
            name: 1,
        }
        let data = await helpers.nft.getNftListPipeline(
            sortFilters,
            filter,
            limit,
            page,
            total,
            userDefaultImage
        )
        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFTs_FETCHED,
            data,
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
            image: req.body.image,
            description: req.body.description,
            properties: JSON.parse(req.body.properties),
            levels: JSON.parse(req.body.levels),
            stats: JSON.parse(req.body.stats),
            fileType: req.body.fileType,
            userId: req.body.userId,
            ownerAddress: req.body.ownerAddress,
            collectionId: req.body.collectionId,
            copies: req.body.copies,
            metaData: req.body.metaData,
        }

        if (!payload.image) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.IMAGE_REQUIRED,
            })
        }

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
        const nftDetail = await NFT.find({ _id: nftId })
        const nft = await NFT.deleteOne({ _id: nftId })
        if (nft?.deletedCount) {
            await NftTokens.deleteOne({ nftId })
            const deleteAuction = await NFTAuction.deleteMany({ nftId })
            const updateCollection = await Collection.updateOne(
                { _id: nftDetail[0].collectionId },
                { $pull: { nft: nftId } }
            )

            if (deleteAuction && updateCollection) {
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
                limit,
            }
        }
        if (startIndex > 0) {
            data.previous = {
                page: page - 1,
                limit,
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
