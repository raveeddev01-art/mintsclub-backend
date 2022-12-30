const BatchUpload = require('../models/batchUpload.model')
const { pinataJWT, pinataSecret, pinataKey } = require('../../config/vars')
const BatchUploadFilesHistory = require('../models/fileHistory.model')
var fs = require('fs')

const NFT = require('../models/nfts.model')
const FormData = require('form-data')

const axios = require('axios')

const checkNFTwithSameNameAlreadyExists = async (name) => {
    const splitName = name.split('#')

    const nft = await NFT.countDocuments({
        name: { $regex: splitName[0].trim(), $options: 'gi' },
    })
    if (nft > 0) {
        const number = parseInt(nft) + 1
        if (splitName?.length > 1) {
            return `${splitName[0].trim()} #${parseInt(splitName[1]) + number}`
        }
        return `${splitName[0].trim()} #${number}`
    }
    return name
}

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

const STANDARD_METADATA_REQUIRED = ['name', 'description']
// const STANDARD_OPTIONAL_METADATA = ['edition', 'properties', 'levels', 'stats']
const METADATA_DATA_TYPES = {
    name: 'string',
    description: 'string',
    image: 'string',
    edition: 'number',
    properties: 'array',
    levels: 'array',
    stats: 'array',
}

const metadataVerification = (JSON_METADATA) => {
    try {
        const usersMetadataKeys = Object.keys(JSON_METADATA)

        STANDARD_METADATA_REQUIRED.forEach((key) => {
            if (!usersMetadataKeys.includes(key)) {
                throw new Error('Standard metadata is not matched.')
            }
        })
        usersMetadataKeys.forEach((key) => {
            if (METADATA_DATA_TYPES[key]) {
                if (typeof JSON_METADATA[key] === 'object') {
                    if (!Array.isArray(JSON_METADATA[key])) {
                        throw new Error(
                            'Standard metadata types is not matched.'
                        )
                    }
                } else if (
                    typeof JSON_METADATA[key] !== METADATA_DATA_TYPES[key]
                ) {
                    throw new Error('Standard metadata types is not matched.')
                }
            }
        })
        return true
    } catch (err) {
        return { success: false, message: err.message }
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
    checkNFTwithSameNameAlreadyExists,
    metadataVerification,
}
