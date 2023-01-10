const fs = require('fs')
const ObjectId = require('mongoose').Types.ObjectId
const NFT = require('../../models/nfts.model')
const Collection = require('../../models/collection.model')
const Categories = require('../../models/categories.model')
const User = require('../../models/users.model')
const Category = require('../../models/categories.model')
const { uploadFileToS3 } = require('../../utils/s3Bucket.js')
const validation = require('../../middlewares/front/collectionValidation')
const helpers = require('../../helpers')

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
            isApproved: req.body.isApproved,
        }

        payload = {
            ...payload,
            banner: req.body.bannerUrl,
        }

        if (req.files) {
            const logoRes = await uploadFileToS3(
                req.files.logo[0].path,
                req.files.logo[0].filename
            )

            const featuredRes = await uploadFileToS3(
                req.files.featuredImg[0].path,
                req.files.featuredImg[0].filename
            )
            if (!logoRes.success) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: logoRes.err,
                })
            }
            if (!featuredRes.success) {
                return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: featuredRes.err,
                })
            }
            console.log({ logoImg: logoRes.file, feat: featuredRes.file })
            payload.logo = logoRes.file
            payload.featuredImg = featuredRes.file
        } else {
            payload.logo = req.body.logo
            payload.featuredImg = req.body.featuredImg
        }

        payload.categoryId = payload.categoryId ? payload.categoryId : null
        if (!payload?.logo) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.LOGO_REQUIRED,
            })
        }

        const existingCollection = await Collection.findOne({
            name: payload.name,
            // blockchainType:payload.blockchainType,
        })

        if (existingCollection) {
            return res.status(HTTP_STATUS_CODE.OK).send({
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

const getDefaultCategory = async () => {
    return await Category.findOne({ default: true })
}

// API to create default collection
exports.createDefault = async (req, res, next) => {
    let num = Math.floor(Math.random() * 1000000)
    const category = await getDefaultCategory()

    try {
        let payload = {
            userId: req.body.userId,
            categoryId: category.id,
            name: category.name + '#' + num,
            url: '',
            description: '',
            ownerAddress: req.body.ownerAddress,
            deploy: false,
            abi: [],
            contractAddress: req.body.contractAddress
                ? req.body.contractAddress
                : '',
            blockchainType: req.body.blockchainType,
            logo: ' ',
            featuredImg: '',
            banner: '',
            isApproved: true,
        }

        let existingCollection = await Collection.findOne({
            name: new RegExp(payload.name, 'gi'),
            userId: payload.userId,
        })

        if (existingCollection) {
            do {
                num = Math.floor(Math.random() * 1000000)
                payload.name = 'Default Collection #' + num

                existingCollection = await Collection.findOne({
                    name: new RegExp(payload.name, 'gi'),
                    userId: payload.userId,
                })
            } while (existingCollection)
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
        if (req.body.isApproved) {
            await Collection.findByIdAndUpdate(
                { _id: ObjectId(req.body.collectionId) },
                { $set: { isApproved: true } },
                { new: true }
            )
            await NFT.updateMany(
                { userId: req.body.userId },
                { isApproved: true }
            )
            return res.send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.COLLECTION_UPDATED,
            })
        }
        let payload = {
            userId: req.body.userId,
            collectionId: req.body.collectionId,
            categoryId: req.body.categoryId,
            name: req.body.name,
            url: req.body.url,
            description: req.body.description,
            logo: req.body.logoUrl,
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
                _id: { $ne: payload.collectionId },
                name: payload?.name,
                userId: payload.userId,
            })
            if (existingCollection)
                return res.status(HTTP_STATUS_CODE.OK).send({
                    success: SUCCESS_STATUS.FALSE,
                    message: ERROR_MESSAGE.COLLECTION_EXIST_ALREADY,
                })
        }

        const collection = await Collection.findByIdAndUpdate(
            { _id: payload.collectionId },
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
            limit =
                limit !== undefined && limit !== '' ? parseInt(limit) : total

            // total = await Collection.countDocuments({})

            if (page > Math.ceil(total / limit) && total > 0)
                page = Math.ceil(total / limit)
        }
        const data = await helpers.collection.collectionListPipeline(
            filter,
            all,
            limit,
            page
        )

        return res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.COLLECTIONS_FETCHED,
            data,
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
            userId = ObjectId(userId)
            const data = await helpers.collection.collectionListByUserId(
                total,
                userId,
                limit,
                page
            )
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.MY_COLLECTIONS_FETCHED,
                data,
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

        page = parseInt(page || '1')
        limit = parseInt(limit || '10')

        const data = await helpers.collection.collectionListPopular(
            filter,

            limit,
            page
        )

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.POPULAR_COLLECTIONS_FETCHED,
            data,
        })
    } catch (error) {
        return next(error)
    }
}

exports.deploy = async (req, res, next) => {
    try {
        let payload = {}
        const { bytecode } = this.getAbi()
        // payload.abi = abi
        payload.bytecode = bytecode
        // console.log(payload, 'payload')
        if (payload) {
            console.log('sending response=>')
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
        console.log(error, 'error')
        return next(error)
    }
}

exports.getAbi = () => {
    try {
        // const buildPath = compilingPreperations()
        const config = createConfiguration()
        const compiled = compileSources(config)
        errorHandling(compiled)
        return writeOutput(compiled)
    } catch (err) {
        console.log(err, 'Error')
    }
}
