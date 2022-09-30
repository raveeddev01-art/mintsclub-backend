const cron = require('node-cron')
const BatchUpload = require('../api/models/batchUpload.model')
const batchUploadQueue = require('../queues/batchUploadQueue')
const { getS3Object } = require('../api/utils/s3Bucket')
const { promises } = require('fs')
const fs = require('fs')

module.exports.batchCrone = async () => {
    try {
        cron.schedule('*/70 * * * * * ', async () => {
            const result = await BatchUpload.find({ status: 'pending' })
            console.log(result, 'result==>')
            if (result && result.length > 0) {
                const {
                    userId,
                    ownerAddress,
                    key,
                    fileName,
                    collectionId,
                    fileType,
                } = result[0]
                let res = await getS3Object(key, fileName)
                if (res) {
                    console.log(fileName, 'fileName')
                    let files = await promises.readdir(
                        `./src/uploads/files/${fileName}/images`
                    )
                    if(files.length&&files.length>350){
                        files=files.slice(0,350)
                    }
                    const metaData = await promises.readdir(
                        `./src/uploads/files/${fileName}/metaData`
                    )
                    await BatchUpload.findByIdAndUpdate(
                        { _id: result[0]._id },
                        { $set: { status: 'inProgress' } }
                    )
                    // console.log('hereeeeeeee')
                    // console.log(files, metaData, 'files==>')
                    files.map(async (item, index) => {
                            // console.log(index,"index================>")
                            try {
                                let initialPayload = {
                                    userId,
                                    creatorId: userId,
                                    ownerId: userId,
                                    ownerAddress: ownerAddress,
                                    lazyMinted: true,
                                    collectionId,
                                    key,
                                    fileName,
                                    fileType,
                                    fileToFetch: item,
                                    metaDataToFetch: `${index + 1}.json`,
                                    index,
                                    files,
                                    id: result[0]._id,
                                }
                                console.log('cron is running')
                                await batchUploadQueue.add({
                                    data: initialPayload,
                                })
                                //Change status pending to inProgress
                            } catch (err) {
                                console.log(
                                    err,
                                    'error coccurrred==============>'
                                )
                            }
                    })
                    ////////////////////
                }
            }
        })
    } catch (err) {}
}
