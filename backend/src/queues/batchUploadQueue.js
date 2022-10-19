/* eslint-disable no-async-promise-executor */
const Queue = require('./queue')
const { pinataJWT, pinataSecret, pinataKey } = require('../config/vars')
const nftQueue = Queue.getQuById('mintsclub-version3')
const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')
const NFT = require('../api/models/nfts.model')
const { deleteFromS3 } = require('../api/utils/s3Bucket')
const BatchUpload = require('../api/models/batchUpload.model')

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

const extracturrentMetaData = async (data) => {
    return new Promise((resolve) => {
        const {
            fileName,
            fileToFetch,
            metaDataToFetch,
            index,
            files,
            key,
            id,
            metaDataFiles,
        } = data
        try {
            //need to change sample to dynamic file name
            fs.readFile(
                `./src/uploads/files/${fileName}/metaData/${metaDataToFetch}`,
                'utf8',
                async (err, jsonString) => {
                    if (err) {
                        console.log(err, 'error 1')
                        return err
                    }
                    await sleep(1000)
                    let uploadedFile = await pinFileToIPFS(
                        fileToFetch,
                        JSON.parse(jsonString),
                        fileName,
                        index
                    )
                    await sleep(1000)
                    let payload = {
                        ...data,
                        tokenId: (Math.floor(Math.random() * 10000) + 10000)
                            .toString()
                            .substring(1),
                        properties: JSON.parse(jsonString).properties,
                        levels: JSON.parse(jsonString).levels,
                        stats: JSON.parse(jsonString).stats,
                        copies: JSON.parse(jsonString).copies,
                        remainingCopies: JSON.parse(jsonString).copies,
                        activeAuction: null,
                        name: JSON.parse(jsonString).name,
                        currentPrice: 0,
                        metaData: uploadedFile.dataInput.metaDataUrl,
                        image: uploadedFile.image,
                    }
                    await NFT.create(payload)
                    console.log('deletion', index + 1, files.length)

                    // await deleteUploadedFile(fileToFetch, metaDataToFetch, fileName)
                    if (index + 1 === files.length) {
                        console.log('conming inside deletion 1')
                        await deleteUnZipedFolder(fileName, key, id)
                    }
                    resolve(true)
                }
            )
        } catch (err) {
            console.log(err, 'error')
            throw new Error(err)
        }
    })
}

const uploadJsonToIpfs = async (dataInput, image, metaDataContent, index) => {
    return new Promise(async (resolve) => {
        const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`
        let properties = {
            properties: metaDataContent.properties,
            levels: metaDataContent.levels,
            stats: metaDataContent.stats,
        }
        const data = {
            name: metaDataContent.name,
            symbol: 'mintsclub',
            sellerFeeBasisPoints: 0,
            image: dataInput.fileUrl,
            description: metaDataContent.description,
            properties,
        }
        try {
            const response = await axios.post(url, data, {
                headers: {
                    Authorization: `Bearer ${pinataJWT}`,
                    pinata_api_key: pinataKey,
                    pinata_secret_api_key: pinataSecret,
                },
            })
            dataInput.ipfsJsonData = data
            dataInput.metaDataUrl =
                'https://mintsclub.mypinata.cloud/ipfs/' +
                response.data.IpfsHash
            resolve({ dataInput, image })
        } catch (err) {
            throw new Error(err)
        }
    })
}

///////// ipfs
const pinFileToIPFS = async (fileToFetch, metaDataContent, fileName, index) => {
    return new Promise(async (resolve) => {
        try {
            let data = new FormData()
            data.append(
                'file',
                fs.createReadStream(
                    `./src/uploads/files/${fileName}/images/${fileToFetch}`
                )
            )
            const fileData = await uploadFileToIpfs(data)
            console.log(fileData, 'fileData uploaded ifps data')
            const fileUrl = `https://mintsclub.mypinata.cloud/ipfs/${fileData.data.IpfsHash}`

            const fileOutputData = { fileUrl, hash: fileData.data.IpfsHash }
            const metaData = await uploadJsonToIpfs(
                fileOutputData,
                fileUrl,
                metaDataContent,
                index
            )
            resolve(metaData)
        } catch (err) {
            throw new Error(err)
        }
    })
}

const uploadFileToIpfs = async (formData) => {
    return new Promise(async (resolve) => {
        try {
            const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary= ${formData._boundary}`,
                    Authorization: `Bearer ${pinataJWT}`,
                    pinata_api_key: pinataKey,
                    pinata_secret_api_key: pinataSecret,
                },
            })
            // console.log(response,"response of uploading ipfs")
            resolve(response)
        } catch (err) {
            throw new Error(err)
        }
    })
}

const deleteUnZipedFolder = (fileName, key, id) => {
    return new Promise((resolve) => {
        fs.rmdir(
            `./src/uploads/files/${fileName}`,
            { recursive: true },
            async (err) => {
                if (err) {
                    throw err
                }
                await deleteFromS3(key)
                await BatchUpload.findByIdAndUpdate(
                    { _id: id },
                    { $set: { status: 'completed' } }
                )
                resolve(true)
            }
        )
    })
}

// const deleteUploadedFile = (fileName, metaDataFileName, folderName) => {
//     return new Promise(async (resolve, reject) => {
//         //delete image file
//         fs.unlink(
//             `./src/uploads/files/${folderName}/images/${fileName}`,
//             async (err) => {
//                 if (err) {
//                     throw new Error(err)
//                 }
//                 //delete metaData file
//                 fs.unlink(
//                     `./src/uploads/files/${folderName}/metaData/${metaDataFileName}`,
//                     async (err) => {
//                         console.log('deleting Files')
//                         if (err) {
//                             throw new Error(err)
//                         }
//                         resolve(true)
//                     }
//                 )
//             }
//         )
//     })
// }

const NftQueue = {
    async run(job) {
        // You can get here
        // job.id;
        // job.data;
        // job.origin; // ['Stripe', 'Paypal', 'Manual']

        // ---------- Job Processor Flow ---------- //
        // Check if order already processed, return Success
        // If no NFT available, then issue refund and sendNFTUnSuccessEmail
        // If any error occurs in sendNFT, then throw error, bull will handle retry
        console.log(job.attemptsMade, 'job attempt')
        await extracturrentMetaData(job.data.data.data)
        return true
    },

    async add(data, jobId) {
        console.log('data', data)
        return nftQueue.add('mintsclub-version3', { data }, { jobId })
    },
}

nftQueue.process('mintsclub-version3', 1, NftQueue.run.bind(NftQueue))

module.exports = NftQueue
