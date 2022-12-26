const BatchUpload = require('../models/batchUpload.model')
const { pinataJWT, pinataSecret, pinataKey } = require('../../config/vars')
const BatchUploadFilesHistory = require('../models/fileHistory.model')

const NFT = require('../models/nfts.model')
const FormData = require('form-data')

const axios = require('axios')

const getBatchByStatus = async (status) => {
    const batch = await BatchUpload.findOne({ status })
    return batch
}

const updateFields = async (query, updatedFields) => {
    const updatedBatch = await BatchUpload.findOneAndUpdate(
        query,
        updatedFields
    )
    return updatedBatch
}

const checkFileAlreadyProcessedOrNot = async (query) => {
    const file = await BatchUploadFilesHistory.findOne(query)
    return file
}

const groupFilesByName = (files) => {
    try {
        const group = {}
        files.forEach((mainLoopFile) => {
            group[`${mainLoopFile?.name}`] = files.filter(
                (file) => file?.name === mainLoopFile?.name
            )
        })

        return group
    } catch (err) {
        console.log(
            '🚀 ~ file: helpers.js ~ line 182 ~ groupFilesByName ~ err',
            err
        )
    }
}

const uploadJsonToIpfs = async (dataInput, image, metaDataContent) => {
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

const uploadFileToIpfs = async (filename) => {
    try {
        let data = new FormData()
        const file = fs.createReadStream(filename)
        data.append('file', file)
        const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
        const response = await axios.post(url, data, {
            maxBodyLength: Infinity,
            maxContentLength: Infinity,

            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                pinata_api_key: `${pinataKey}`,
                pinata_secret_api_key: `${pinataSecret}`,
            },
        })
        const res = response.data
        if (res) {
            file.close()
        }
        return res
    } catch (err) {
        console.log('🚀 ~ Error in uploading image on ipfs', err)
        return err
    }
}

module.exports = {
    uploadFileToIpfs,
    uploadJsonToIpfs,
    groupFilesByName,
    checkFileAlreadyProcessedOrNot,
    updateFields,
    getBatchByStatus,
}
