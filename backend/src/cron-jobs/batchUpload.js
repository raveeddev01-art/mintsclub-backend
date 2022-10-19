/* eslint-disable no-unused-expressions */
const BatchUpload = require('../../models/batchUpload.model')
const batchUploadQueue = require('../../../queues/batchUploadQueue')
const { getS3Object } = require('../../utils/s3Bucket')
const { promises } = require('fs')
const fs = require('fs')
exports.batchUpload = async (req, res, next) => {
    try {
        cron.schedule('*/3 * * * *', async () => {
            const result = await BatchUpload.find({ status: 'pending' })
            if (result && result.length > 0) {
                await setStatus(result[0]._id, 'inProgress')
                const {
                    userId,
                    ownerAddress,
                    key,
                    fileName,
                    collectionId,
                    fileType,
                } = result[0]
                await BatchUpload.findByIdAndUpdate(
                    { _id: result[0]._id },
                    { $set: { status: 'inProgress' } }
                )
                let res = await getS3Object(key, fileName)
                if (res) {
                    console.log(isDirExist(fileName), 'isDirExist(fileName)')
                    if (isDirExist(fileName)) {
                        let files = await promises.readdir(
                            `./src/uploads/files/${fileName}/images`
                        )
                        if (!files?.length > 0) {
                            await setStatus(result[0]._id, 'rejected')
                            return
                        }
                        if (files.length && files.length > 350) {
                            files = files.slice(0, 350)
                        }
                        let metaDataFiles = await promises.readdir(
                            `./src/uploads/files/${fileName}/metaData`
                        )
                        if (!metaDataFiles?.length > 0) {
                            await setStatus(result[0]._id, 'rejected')
                            return
                        }

                        // console.log('hereeeeeeee')
                        // console.log(files, metaData, 'files==>')
                        files &&
                            files.length > 0 &&
                            files.map(async (item, index) => {
                                // console.log(index,"index================>")
                                console.log({
                                    imageName: item.substr(
                                        0,
                                        item.lastIndexOf('.')
                                    ),
                                    metaData: `${index + 1}`,
                                    typeOfImage: typeof item.substr(
                                        0,
                                        item.lastIndexOf('.')
                                    ),
                                })

                                console.log(
                                    item.substr(0, item.lastIndexOf('.')) ===
                                        `${index + 1}`,
                                    'validation'
                                )

                                console.log(
                                    item.substr(0, item.lastIndexOf('.')) ===
                                        `${index + 1}`,
                                    'validation'
                                )
                                console.log(
                                    fs.existsSync(
                                        `./src/uploads/files/${fileName}/metaData/${item.substr(
                                            0,
                                            item.lastIndexOf('.')
                                        )}.json`
                                    ),
                                    'true or flase'
                                )
                                if (
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
                                            id: result[0]._id,
                                        }
                                        await batchUploadQueue.add({
                                            data: initialPayload,
                                        })
                                        //Change status pending to inProgress
                                    } catch (err) {
                                        console.log(err, 'error exist')
                                        await setStatus(
                                            result[0]._id,
                                            'rejected'
                                        )

                                        return err
                                    }
                                }
                            })

                        ////////////////////
                    } else {
                        await setStatus(result[0]._id, 'rejected')
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
                                console.log("it's decrementing")
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
        console.log('error', err)
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
