/* eslint-disable no-unused-expressions */
const BatchUpload = require('../../models/batchUpload.model')
const ObjectId = require('mongoose').Types.ObjectId

exports.verifyFileAlreadyProcessed = async (request, response) => {
    try {
        const { fileName, userId } = request.query

        if (!fileName || !userId) {
            return response.status(204).send({
                success: false,
                message: 'Please provide content',
            })
        }
        const fileNameValidation = await BatchUpload.findOne({
            fileName: { $regex: fileName, $options: 'gi' },
            userId,
        })

        if (fileNameValidation?._id) {
            return response.status(200).send({
                success: false,
                message: 'File is already uploaded.',
            })
        }

        return response.status(200).send({
            success: true,
            message: 'You are good to proceed.',
        })
    } catch (err) {
        console.log(
            '🚀 ~ file: batchUpload.controller.js:8 ~ exports.verifyFileAlreadyProcessed= ~ err',
            err
        )
        return response.status(500).send({
            success: false,
            message: 'Something went wrong ' + err.message,
        })
    }
}

exports.batchUpload = async (req, res, next) => {
    try {
        let payload = {
            key: req.body.key,
            fileName: req.body.fileName,
            collectionId: req.body.collectionId,
            blockchainType: req.body.blockchainType,
            categoryId: req.body.categoryId,
            status: req.body.status,
            ownerAddress: req.body.ownerAddress,
            userId: req.body.userId,
            location: req.body.location,
        }

        let blockchainType = payload?.blockchainType
        const result = await BatchUpload.create(payload)

        if (!result) {
            return res.status(200).send({
                success: false,
                message: 'Please follow file upload standards',
            })
        }
        return res.status(200).send({
            success: true,
            message: 'File is uploaded and added to cronJob.',
        })
    } catch (err) {
        next(err)
    }
}

const isDirExist = (fileName) => {
    if (fs.existsSync(`./src/uploads/files/${fileName}/`)) {
        return true
    } else {
        return false
    }
}

const setStatus = async (id, status) => {
    await BatchUpload.findByIdAndUpdate({ _id: id }, { $set: { status } })
    return true
}

const removeDirctory = (fileName) => {
    fs.rmdir(
        `./src/uploads/files/${fileName}`,
        { recursive: true },
        async (err) => {
            if (err) {
                throw err
            }
            return true
        }
    )
}

exports.getBatchByUser = async (request, response) => {
    try {
        let { userId, page, limit } = request.query
        console.log(
            '🚀 ~ file: batchUpload.controller.js:103 ~ exports.getBatchByUser= ~ id',
            userId,
            page,
            limit
        )

        page = parseInt(page || '1')
        limit = parseInt(limit || '12')

        const pipeline = [
            {
                $match: {
                    userId: ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: 'collections',
                    localField: 'collectionId',
                    foreignField: '_id',
                    as: 'collectionId',
                    pipeline: [
                        {
                            $project: {
                                name: true,
                                logo: true,
                                cover: true,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$collectionId',
                    includeArrayIndex: '0',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'filehistories',
                    localField: '_id',
                    foreignField: 'batchId',
                    as: 'processedFiles',
                    pipeline: [
                        {
                            $count: 'total',
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$processedFiles',
                    includeArrayIndex: '0',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    blockchainType: true,
                    categoryId: true,
                    collectionId: true,
                    createdAt: true,
                    fileName: true,
                    processedFiles: true,
                    status: true,
                    updatedAt: true,
                    userId: true,
                    message: true,
                },
            },
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
            {
                $sort: {
                    _id: -1,
                },
            },
        ]

        const pendingBatch = await BatchUpload.aggregate(pipeline)

        return response.status(200).send({
            success: true,
            data: {
                pagination: pendingBatch[0].metadata[0],
                pendingBatches: pendingBatch[0].data,
            },
        })
    } catch (err) {
        console.log(
            '🚀 ~ file: batchUpload.controller.js:104 ~ exports.getBatchByUser= ~ err',
            err
        )
    }
}
