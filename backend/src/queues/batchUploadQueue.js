const Queue = require('./queue')
const { pinataJWT } = require('../config/vars')
const nftQueue = Queue.getQuById('insert-batch-uploadFile')
const fs = require('fs')
const axios = require('axios')
var FormData = require('form-data')
const NFT = require('../api/models/nfts.model')
const {deleteFromS3} =require('../api/utils/s3Bucket')
const BatchUpload = require('../api/models/batchUpload.model')

const extracturrentMetaData = async (data) => {
    const { fileName, fileToFetch, metaDataToFetch, index, files,key ,id} = data

    try {
        //need to change sample to dynamic file name

        fs.readFile(
            `./src/uploads/files/${fileName}/metaData/${metaDataToFetch}`,
            'utf8',
            async (err, jsonString) => {
                if (err) {
                    return console.log(err, 'error=======>')
                }
                let uploadedFile = await pinFileToIPFS(
                    fileToFetch,
                    JSON.parse(jsonString),
                    fileName
                )

                let payload = {
                    ...data,
                    nftToken: (Math.floor(Math.random() * 10000) + 10000)
                        .toString()
                        .substring(1),
                    properties: JSON.parse(jsonString).properties,
                    levels: JSON.parse(jsonString).levels,
                    stats: JSON.parse(jsonString).stats,
                    copies: JSON.parse(jsonString).copies,
                    remainingCopies: JSON.parse(jsonString).copies,
                    activeAuction: null,
                    name: JSON.parse(jsonString).name,
                    categoryId: '625569a22b58bd0bf3480572',
                    currentPrice: 0,
                    metaData: uploadedFile.dataInput.metaDataUrl,
                    image: uploadedFile.image,
                }
                await NFT.create(payload)
                await deleteUploadedFile(fileToFetch, metaDataToFetch, fileName)
                if (index + 1 === files.length) {
                    await deleteUnZipedFolder(fileName,key,id)
                }
                return true
            }
        )
    } catch (err) {
        console.log(err, 'error====>.')
        throw new Error(err)
    }
}

///////// ipfs
const pinFileToIPFS = async (fileToFetch, metaDataContent, fileName) => {
    console.log(fileToFetch,fileName,"fileToFetch and fileName==>")
    try {
        let data = new FormData()
        data.append(
            'file',
            fs.createReadStream(
                `./src/uploads/files/${fileName}/images/${fileToFetch}`
            )
        )
        const fileData = await uploadFileToIpfs(data)
        const fileUrl = `https://gateway.pinata.cloud/ipfs/${fileData.data.IpfsHash}`
        console.log(fileUrl,"fileUrl==>")
        const fileOutputData = { fileUrl, hash: fileData.data.IpfsHash }
        const metaData = await uploadJsonToIpfs(
            fileOutputData,
            fileUrl,
            metaDataContent
        )
        return metaData
    } catch (err) {
        console.log(err, 'error while pinning file to ipfs')
        throw new Error(err)
    }
}

const uploadFileToIpfs = async (formData) => {
    try {
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary= ${formData._boundary}`,
                Authorization: `Bearer ${pinataJWT}`,
            },
        })
        return response
    } catch (err) {
        console.log(err, 'error while uploading files to ipfs')
        throw new Error(err)
    }
}
uploadJsonToIpfs = async (dataInput, image, metaDataContent) => {
    console.log('uploading metadata files')
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
        properties: properties,
    }
    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${pinataJWT}`,
            },
        })
        dataInput.ipfsJsonData = data
        dataInput.metaDataUrl =
            'https://gateway.pinata.cloud/ipfs/' + response.data.IpfsHash
        return { dataInput, image }
    } catch (err) {
        console.log('error while uploading jsons')
        throw new Error(err)
    }
}

const deleteUnZipedFolder = (fileName,key,id) => {
    console.log("deleting zipped folder==>")
    return new Promise(async (resolve, reject) => {
        fs.rmdir(
            `./src/uploads/files/${fileName}`,
            { recursive: true },
            async (err) => {
                if (err) {
                    throw err
                }
                await  deleteFromS3(key)
                await  BatchUpload.deleteOne({_id:id})
                resolve(true)
            }
        )
     
    })
}
const deleteUploadedFile = (fileName, metaDataFileName, folderName) => {
    return new Promise(async (resolve, reject) => {
        //delete image file
        fs.unlink(
            `./src/uploads/files/${folderName}/images/${fileName}`,
            async (err) => {
                if (err) {
                    throw new Error(err)
                }
                resolve(true)
            }
        )
        //delete metaData file
        fs.unlink(
            `./src/uploads/files/${folderName}/metaData/${metaDataFileName}`,
            async (err) => {
                if (err) {
                    throw new Error(err)
                }
                resolve(true)
            }
        )
    })
}

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
        console.log(
            job.attemptsMade,
            job.data.data.data.fileToFetch,
            'job.attemptsMade'
        )
        await extracturrentMetaData(job.data.data.data)
        return true
    },

    async add(data, jobId) {
        return nftQueue.add('insert-batch-uploadFile', { data }, { jobId })
    },
}

nftQueue.process('insert-batch-uploadFile', 1, NftQueue.run.bind(NftQueue))

module.exports = NftQueue
