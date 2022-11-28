const { pinataJWT, ipfsBaseUrl, pinataBaseUrl } = require('../../config/vars')
const FormData = require('form-data')
const fs = require('fs')
const axios = require('axios')
const uploadFileToIpfs = async (formData) => {
    try {
        const url = `${ipfsBaseUrl}/pinFileToIPFS`
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary= ${formData._boundary}`,
                Authorization: `Bearer ${pinataJWT}`,
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        })
        return response
    } catch (err) {
        console.log(err, 'error while file to ipfs')
    }
}
const handleJsons = async (fileUrl, nftInfo) => {
    const dataInput = {}
    const url = `${ipfsBaseUrl}/pinJSONToIPFS`
    let { name, description, collection } = nftInfo
    collection = JSON.parse(collection)
    let creators = []
    if (nftInfo?.creators) {
        creators = JSON.parse(nftInfo?.creators)
    }
    let sellerFeeBasisPoints = 0
    if (nftInfo?.sellerFeeBasisPoints) {
        sellerFeeBasisPoints = nftInfo?.sellerFeeBasisPoints
    }
    const properties = {
        properties: JSON.parse(nftInfo.properties),
        levels: JSON.parse(nftInfo.levels),
        stats: JSON.parse(nftInfo.stats),
        creators,
    }
    const data = {
        name,
        symbol: 'Gamo',
        sellerFeeBasisPoints,
        image: fileUrl,
        description,
        properties,
        collection,
    }

    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${pinataJWT}`,
            },
        })
        dataInput.ipfsJsonData = data
        dataInput.metaDataUrl = `${pinataBaseUrl}/${response.data.IpfsHash}`
        dataInput.fileUrl = fileUrl
        return { dataInput, image: fileUrl }
    } catch (err) {
        console.log(err, 'Error while json ')
    }
}

exports.uploadJsonToIpfs = async (fileUrl, nftInfo) => {
    let res = await handleJsons(fileUrl, nftInfo)
    return res
}
exports.pinFileToIPFS = async (files, data) => {
    try {
        const originalFile = new FormData()
        const compressedFile = new FormData()
        let compressedIpfsFile = null
        originalFile.append(
            'file',
            fs.createReadStream(`${files.image[0].path}`)
        )
        if (files?.compressedFile) {
            compressedFile.append(
                'file',
                fs.createReadStream(`${files.compressedFile[0].path}`)
            )
            compressedIpfsFile = await uploadFileToIpfs(compressedFile)
            compressedIpfsFile = `${pinataBaseUrl}/${compressedIpfsFile.data.IpfsHash}`
            await deleteFileFromDirectory(files.compressedFile[0].path)
        }
        const orignalIpfsFile = await uploadFileToIpfs(originalFile)
        const fileUrl = `${pinataBaseUrl}/${orignalIpfsFile.data.IpfsHash}`
        await deleteFileFromDirectory(files.image[0].path)

        let metaData = await handleJsons(fileUrl, { ...data })
        if (compressedIpfsFile) {
            metaData.compressedFileUrl = compressedIpfsFile
        }
        return metaData
    } catch (err) {
        console.log(err, 'error while file')
    }
}
const deleteFileFromDirectory = (path) => {
    return new Promise((resolve, reject) => {
        fs.unlink(`${path}`, async (err) => {
            if (err) {
                reject({ success: false, err })
            }
            resolve({ success: true })
        })
    })
}
