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
    const properties = {
        properties: JSON.parse(nftInfo.properties),
        levels: JSON.parse(nftInfo.levels),
        stats: JSON.parse(nftInfo.stats),
    }
    const data = {
        name,
        symbol: 'Gamo',
        sellerFeeBasisPoints: 0,
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

        originalFile.append(
            'file',
            fs.createReadStream(`${files.image[0].path}`)
        )
        compressedFile.append(
            'file',
            fs.createReadStream(`${files.compressedFile[0].path}`)
        )
        const orignalIpfsFile = await uploadFileToIpfs(originalFile)
        const compressedIpfsFile = await uploadFileToIpfs(compressedFile)
        const fileUrl = `${pinataBaseUrl}/${orignalIpfsFile.data.IpfsHash}`
        const compressedFileUrl = `${pinataBaseUrl}/${compressedIpfsFile.data.IpfsHash}`
        await deleteFileFromDirectory(files.image[0].path)
        await deleteFileFromDirectory(files.compressedFile[0].path)

        const metaData = await handleJsons(fileUrl, { ...data })
        return { ...metaData, compressedFileUrl }
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
