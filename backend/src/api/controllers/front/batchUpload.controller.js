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
            blockchainType: req.body.blockchainType,
            categoryId: req.body.categoryId,
            status: req.body.status,
            ownerAddress: req.body.ownerAddress,
            userId: req.body.userId,
        }

        let blockchainType = payload?.blockchainType
        const result = await BatchUpload.create(payload)
        if (result) {
            const { userId, ownerAddress, key, fileName, collectionId } = result
            let s3Response = await getS3Object(key, fileName)

            if (s3Response) {
                if (isDirExist(fileName)) {
                    let files = await promises.readdir(
                        `./src/uploads/files/${fileName}/`
                    )
                    if (!files?.length > 0) {
                        await setStatus(result._id, 'rejected')
                        removeDirctory(fileName)
                        return res.status(200).send({
                            success: false,
                            message: 'Zip File should not be empty',
                        })
                    }

                    if (files.length && files.length > 350) {
                        files = files.slice(0, 350)
                    }

                    let metaDataFiles = await promises.readdir(
                        `./src/uploads/files/${fileName}/`
                    )

                    metaDataFiles.filter((value) => {
                        return value.match(/.json/)
                    })

                    let filesToIgnore = files.filter((value) => {
                        return (
                            (!value.match(/.jpeg/) &&
                                !value.match(/.jpg/) &&
                                !value.match(/.png/) &&
                                !fs.existsSync(
                                    `./src/uploads/files/${fileName}/${value.substr(
                                        0,
                                        value.lastIndexOf('.')
                                    )}.json`
                                )) ||
                            !fs.existsSync(
                                `./src/uploads/files/${fileName}/${value.substr(
                                    0,
                                    value.lastIndexOf('.')
                                )}.json`
                            ) ||
                            (!value.match(/.jpeg/) &&
                                !value.match(/.jpg/) &&
                                !value.match(/.png/) &&
                                !value.match(/.json/) &&
                                fs.existsSync(
                                    `./src/uploads/files/${fileName}/${value.substr(
                                        0,
                                        value.lastIndexOf('.')
                                    )}.json`
                                )) ||
                            (!value.match(/.jpeg/) &&
                                !value.match(/.jpg/) &&
                                !value.match(/.png/) &&
                                !value.match(/.json/) &&
                                fs.existsSync(
                                    `./src/uploads/files/${fileName}/${value.substr(
                                        0,
                                        value.lastIndexOf('.')
                                    )}.json`
                                ))
                        )
                    })

                    filesToIgnore.filter((value) => {
                        if (
                            fs.existsSync(
                                `./src/uploads/files/${fileName}/${value.substr(
                                    0,
                                    value.lastIndexOf('.')
                                )}.json`
                            )
                        ) {
                            filesToIgnore.push(value)
                        }
                    })
                    filesToIgnore =
                        filesToIgnore.length > 0 ? filesToIgnore.length : 0

                    let FilesToDecrement = files.length - filesToIgnore

                    files &&
                        files.length > 0 &&
                        files.map(async (item, index) => {
                            const checkFileType = item.split('.')
                            if (
                                checkFileType[1] === 'jpeg' ||
                                checkFileType[1] === 'png' ||
                                checkFileType[1] === 'jpg'
                            ) {
                                if (
                                    fs.existsSync(
                                        `./src/uploads/files/${fileName}/${item.substr(
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
                                            fileType: 'image',
                                            fileToFetch: item,
                                            metaDataToFetch: `${item.substr(
                                                0,
                                                item.lastIndexOf('.')
                                            )}.json`,
                                            index,
                                            files,
                                            metaDataFiles,
                                            id: result._id,
                                            FilesToDecrement,
                                        }
                                        await batchUploadQueue.add({
                                            data: initialPayload,
                                        })
                                    } catch (err) {
                                        await setStatus(result._id, 'rejected')
                                        return res.status(200).send({
                                            success: false,
                                            message:
                                                'Please follow file upload standards',
                                        })
                                    }
                                }
                            }
                        })
                    ////////////////////
                } else {
                    await setStatus(result._id, 'rejected')
                    removeDirctory(fileName)
                    return res.status(200).send({
                        success: false,
                        message: 'Please follow file upload standards',
                    })
                }
            } else {
                await setStatus(result._id, 'rejected')
                removeDirctory(fileName)
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
