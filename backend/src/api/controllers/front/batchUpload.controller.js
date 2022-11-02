/* eslint-disable no-unused-expressions */
const BatchUpload = require('../../models/batchUpload.model')
const batchUploadQueue = require('../../../queues/batchUploadQueue')
const { getS3Object } = require('../../utils/s3Bucket')
const { promises } = require('fs')
const fs = require('fs')
exports.batchUpload = async (req, res, next) => {
    try {
        let payload = {
            key: req.body.key,
            fileName: req.body.fileName,
            collectionId: req.body.collectionId,
            fileType: req.body.fileType,
            chainId: req.body.chainId,
            categoryId: req.body.categoryId,
            status: 'inProgress',
            ownerAddress: req.body.ownerAddress,
            userId: req.body.userId,
        }
        let blockchainType
        if (payload?.chainId === 1) {
            blockchainType = 'ethereum'
        } else if (payload?.chainId === 2) {
            blockchainType = 'polygon'
        } else {
            blockchainType = 'bsc'
        }
        const result = await BatchUpload.create(payload)
        if (result) {
            const {
                userId,
                ownerAddress,
                key,
                fileName,
                collectionId,
                fileType,
            } = result
            let s3Response = await getS3Object(key, fileName)
            if (s3Response) {
                if (isDirExist(fileName)) {
                    let files = await promises.readdir(
                        `./src/uploads/files/${fileName}/images`
                    )
                    if (!files?.length > 0) {
                        await setStatus(result._id, 'rejected')
                        return res.status(200).send({
                            success: false,
                            message: 'nft Images directory should not be empty',
                        })
                    }
                    if (files.length && files.length > 350) {
                        files = files.slice(0, 350)
                    }
                    let metaDataFiles = await promises.readdir(
                        `./src/uploads/files/${fileName}/metaData`
                    )
                    if (!metaDataFiles?.length > 0) {
                        await setStatus(result._id, 'rejected')
                        return res.status(200).send({
                            success: false,
                            message:
                                'nft metadata directory should not be empty',
                        })
                    }
                    files &&
                        files.length > 0 &&
                        files.map(async (item, index) => {
                            if (
                                !fs.existsSync(
                                    `./src/uploads/files/${fileName}/metaData/${item.substr(
                                        0,
                                        item.lastIndexOf('.')
                                    )}.json`
                                )
                            ) {
                                files.length--
                            } else if (
                                fs.existsSync(
                                    `./src/uploads/files/${fileName}/metaData/${item.substr(
                                        0,
                                        item.lastIndexOf('.')
                                    )}.json`
                                )
                            ) {
                                try {
                                    let initialPayload = {
                                        userId,
                                        creatorId: userId,
                                        ownerId: userId,
                                        ownerAddress,
                                        lazyMinted: true,
                                        isApproved: true,
                                        blockchainType,
                                        collectionId,
                                        key,
                                        fileName,
                                        fileType,
                                        fileToFetch: item,
                                        metaDataToFetch: `${item.substr(
                                            0,
                                            item.lastIndexOf('.')
                                        )}.json`,
                                        index,
                                        files,
                                        metaDataFiles,
                                        id: result._id,
                                    }
                                    await batchUploadQueue.add({
                                        data: initialPayload,
                                    })
                                } catch (err) {
                                    await setStatus(result._id, 'rejected')
                                    return res.status(200).send({
                                        success: false,
                                        message:
                                            'Please upload zip as per mentioned conditions',
                                    })
                                }
                            }
                        })
                    ////////////////////
                } else {
                    await setStatus(result._id, 'rejected')
                    return res.status(200).send({
                        success: false,
                        message: 'Please follow file upload standards',
                    })
                }
            } else {
                await setStatus(result._id, 'rejected')
                return res.status(200).send({
                    success: false,
                    message: 'Please follow file upload standards',
                })
            }
        }
        return res.status(201).send({
            success: true,
            message: 'Batch uploading is added to the queue successfully',
        })
    } catch (err) {
        next(err)
    }
}

const isDirExist = (fileName) => {
    if (
        fs.existsSync(`./src/uploads/files/${fileName}/images`) &&
        fs.existsSync(`./src/uploads/files/${fileName}/metaData`)
    ) {
        return true
    } else {
        return false
    }
}

const setStatus = async (id, status) => {
    await BatchUpload.findByIdAndUpdate({ _id: id }, { $set: { status } })
    return true
}
