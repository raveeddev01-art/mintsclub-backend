/* eslint-disable no-unused-expressions */
const cron = require('node-cron')
// const { pinataJWT, pinataSecret, pinataKey } = require('../config/vars')
// const BatchUpload = require('../api/models/batchUpload.model')
const BatchUploadFilesHistory = require('../api/models/fileHistory.model')
const NFT = require('../api/models/nfts.model')

const {
    uploadFileToIpfs,
    uploadJsonToIpfs,
    groupFilesByName,
    checkFileAlreadyProcessedOrNot,
    updateFields,
    getBatchByStatus,
} = require('../api/helpers/batchUpload.helper')

// const FormData = require('form-data')

const AdmZip = require('adm-zip')
const fs = require('fs')
const https = require('https')
const path = require('path')
// const axios = require('axios')

module.exports.batchCrone = async () => {
    cron.schedule('*/10 * * * * *', async () => {
        let batchToBeProcessed = undefined
        try {
            batchToBeProcessed = await getBatchByStatus('processing')

            if (batchToBeProcessed?._id) {
                console.log(
                    `${batchToBeProcessed?._id} BATCH IS ALREADY IN PROGRESS.`
                )
                return
            }

            if (!batchToBeProcessed?._id) {
                batchToBeProcessed = await getBatchByStatus('pending')
            }

            if (!batchToBeProcessed?._id) {
                console.log('NO PENDING BATCH FOUND TO PROCESS.')
                return false
            }

            await updateFields(
                { _id: batchToBeProcessed?._id },
                { $set: { status: 'processing' } }
            )

            const acceptedImageFiles = ['jpg', 'png', 'jpeg']
            const acceptedFiles = [...acceptedImageFiles, 'json']

            const currentTimeStamp =
                new Date().getTime() + Math.floor(Math.random() * 1000)
            const downloadedFilePath = `zipFiles/${currentTimeStamp}-${currentTimeStamp}.zip`

            const file = fs.createWriteStream(downloadedFilePath)

            https.get(batchToBeProcessed?.location, async (response) => {
                response.pipe(file)

                file.on('finish', async function () {
                    file.close()
                    console.log('BATCH-UPLOAD-CRON-JOB: File Downloaded')

                    try {
                        const zip = new AdmZip(downloadedFilePath)
                        console.log(
                            'BATCH-UPLOAD-CRON-JOB: Extracting Files...'
                        )
                        zip.extractAllTo('zipExtractedFiles', true)

                        if (fs.existsSync('zipExtractedFiles')) {
                            const files = fs
                                .readdirSync('zipExtractedFiles')
                                .map(async (fileName) => {
                                    const [name, extension] =
                                        fileName.split('.')

                                    if (
                                        !acceptedFiles.find(
                                            (file) => file === extension
                                        )
                                    ) {
                                        await Promise.all([
                                            updateFields(
                                                {
                                                    _id: batchToBeProcessed?._id,
                                                },
                                                {
                                                    $set: {
                                                        status: 'failed',
                                                        message:
                                                            "Filetype don't matched",
                                                    },
                                                }
                                            ),
                                        ])
                                        throw new Error('Wrong file type found')
                                    }

                                    return {
                                        path: path.join(
                                            'zipExtractedFiles',
                                            fileName
                                        ),
                                        name,
                                        extension,
                                    }
                                })

                            const extractedFiles = await Promise.all(files)

                            const groupedFiles =
                                groupFilesByName(extractedFiles)

                            console.log(
                                'BATCH-UPLOAD-CRON-JOB: Uploading NFT image to IPFS and Update Database...'
                            )

                            for (const [key, value] of Object.entries(
                                groupedFiles
                            )) {
                                const jsonFile = value.find(
                                    (file) => file.extension === 'json'
                                )

                                const imageFile = value.find((file) =>
                                    acceptedImageFiles.find(
                                        (fileExtention) =>
                                            fileExtention === file.extension
                                    )
                                )

                                const isFileAlreadyProcessed =
                                    await checkFileAlreadyProcessedOrNot({
                                        batchId: batchToBeProcessed?._id,
                                        fileName: imageFile?.name,
                                    })

                                if (!isFileAlreadyProcessed?._id) {
                                    const jsonFileContent = fs.readFileSync(
                                        jsonFile?.path
                                    )

                                    const imageFileUri = await uploadFileToIpfs(
                                        imageFile?.path
                                    )

                                    if (imageFileUri?.IpfsHash) {
                                        console.log(
                                            'BATCH-UPLOAD-CRON-JOB: NFT file Uploaded...'
                                        )

                                        fs.unlinkSync(imageFile.path)
                                        console.log(
                                            'BATCH-UPLOAD-CRON-JOB: NFT file is Removed...'
                                        )

                                        const imageFileUrl = `https://mintsclub.mypinata.cloud/ipfs/${imageFileUri?.IpfsHash}`

                                        let jsonMetadata = undefined

                                        try {
                                            jsonMetadata =
                                                JSON.parse(jsonFileContent)
                                        } catch (err) {
                                            console.log(
                                                '🚀 ~ file: batchUpload.js:180 ~ err',
                                                err
                                            )
                                            await Promise.all([
                                                updateFields(
                                                    {
                                                        _id: batchToBeProcessed?._id,
                                                    },
                                                    {
                                                        $set: {
                                                            status: 'failed',
                                                        },
                                                    }
                                                ),
                                                // database.batchUpload.updateBatchStatus(
                                                //     pendingBatch?._id,
                                                //     'failed'
                                                // ),
                                                // database.batchUpload.setMessage(
                                                //     pendingBatch?._id,
                                                //     err.message
                                                // ),
                                            ])

                                            const remainingFilesInSideFolder =
                                                fs.readdirSync(
                                                    'zipExtractedFiles',
                                                    { withFileTypes: true }
                                                )

                                            for (const {
                                                name,
                                            } of remainingFilesInSideFolder) {
                                                console.log(
                                                    'File Removed => ',
                                                    name
                                                )
                                                fs.unlinkSync(
                                                    path.join(
                                                        'zipExtractedFiles',
                                                        name
                                                    )
                                                )
                                            }

                                            console.log(
                                                'BATCH-UPLOAD-CRON-JOB: Other Files Removed'
                                            )

                                            fs.unlinkSync(downloadedFilePath)
                                            console.log(
                                                'BATCH-UPLOAD-CRON-JOB: Zip File Removed'
                                            )

                                            return false
                                        }

                                        let payload = {
                                            ...jsonMetadata,
                                            tokenId: (
                                                Math.floor(
                                                    Math.random() * 10000
                                                ) + 10000
                                            )
                                                .toString()
                                                .substring(1),
                                            properties:
                                                jsonMetadata?.properties,
                                            levels: jsonMetadata?.levels,
                                            stats: jsonMetadata?.stats,
                                            copies: 1,
                                            creatorId:
                                                batchToBeProcessed?.userId,
                                            remainingCopies: 1,
                                            activeAuction: null,
                                            name: jsonMetadata?.name,
                                            currentPrice: 0,
                                            fileType: 'image',
                                            ...(batchToBeProcessed?.blockchainType ===
                                            'algorand'
                                                ? {
                                                      algoLazyMinted: true,
                                                  }
                                                : { lazyMinted: true }),

                                            image: imageFileUrl,
                                            ownerAddress:
                                                batchToBeProcessed?.ownerAddress,
                                            collectionId:
                                                batchToBeProcessed?.collectionId,
                                            categoryId:
                                                batchToBeProcessed?.categoryId,
                                            ownerId: batchToBeProcessed?.userId,
                                            creatorId:
                                                batchToBeProcessed?.userId,
                                            userId: batchToBeProcessed?.userId,
                                            blockchainType:
                                                batchToBeProcessed?.blockchainType,
                                        }

                                        const metadataUriResponse =
                                            await uploadJsonToIpfs(
                                                {
                                                    fileUrl: imageFileUrl,
                                                },
                                                imageFileUrl,
                                                payload
                                            )

                                        console.log(
                                            '🚀 ~ file: batchUpload.js:250 ~ metadataUriResponse',
                                            metadataUriResponse?.dataInput
                                                ?.metaDataUrl
                                        )

                                        const NFTAdded = await NFT.create({
                                            ...payload,
                                            metadata:
                                                metadataUriResponse?.dataInput
                                                    ?.metaDataUrl,
                                        })

                                        if (NFTAdded?._id) {
                                            await BatchUploadFilesHistory.create(
                                                {
                                                    nftId: NFTAdded?._id,
                                                    fileName: imageFile?.name,
                                                    batchId:
                                                        batchToBeProcessed?._id,
                                                    zipFile: downloadedFilePath,
                                                }
                                            )
                                            fs.unlinkSync(jsonFile?.path)
                                        }
                                    }
                                } else {
                                    fs.unlinkSync(imageFile.path)
                                    fs.unlinkSync(jsonFile?.path)
                                    console.log(
                                        'BATCH-UPLOAD-CRON-JOB: Image file is already processed'
                                    )
                                }
                            }
                            fs.unlinkSync(downloadedFilePath)
                            console.log(
                                'BATCH-UPLOAD-CRON-JOB: Zip File Removed from Server...'
                            )

                            await Promise.all([
                                updateFields(
                                    { _id: batchToBeProcessed?._id },
                                    { $set: { status: 'completed' } }
                                ),

                                // database.notification.addNotification({
                                //     batchId: pendingBatch?._id,
                                //     userId: pendingBatch?.userId?._id,
                                //     type: pendingBatch?.launchPad
                                //         ? 'launchUploaded'
                                //         : 'batchUploaded',
                                // }),
                            ])
                        }
                    } catch (err) {
                        await updateFields(
                            { _id: batchToBeProcessed?._id },
                            { $set: { status: 'failed', message: err.message } }
                        )

                        const remainingFilesInSideFolder = fs.readdirSync(
                            'zipExtractedFiles',
                            { withFileTypes: true }
                        )

                        for (const { name } of remainingFilesInSideFolder) {
                            console.log('File Removed => ', name)
                            fs.unlinkSync(path.join('zipExtractedFiles', name))
                        }

                        console.log(
                            'BATCH-UPLOAD-CRON-JOB: Other Files Removed'
                        )

                        fs.unlinkSync(downloadedFilePath)
                        console.log('BATCH-UPLOAD-CRON-JOB: Zip File Removed')
                        throw err
                    }
                })
            })
        } catch (err) {
            console.log(
                '🚀 ~ file: batchUpload.js:15 ~ cron.schedule ~ err',
                err
            )
            await updateFields(
                { _id: batchToBeProcessed?._id },
                { $set: { status: 'failed', message: err?.message } }
            )
            return false
        }
    })
}
