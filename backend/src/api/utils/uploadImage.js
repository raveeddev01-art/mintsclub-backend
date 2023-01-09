const fs = require('fs')
const multer = require('multer')
const axios = require('axios')
const uploadsDir = './src/uploads/'
const imagesDir = `${uploadsDir}images/`

const storage = multer.diskStorage({
    destination(req, file, cb) {
        // make uploads directory if do not exist
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)

        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir)

        cb(null, imagesDir)
    },
    filename(req, file, cb) {
        cb(null, Date.now() + '.png')
    },
})
const upload = multer({
    storage,
    limits: {
        fileSize: 100000000, //100MB
    },
})
exports.cpUpload = upload.fields([{ name: 'image', maxCount: 1 }])
exports.uploadSingle = upload.single('image')

///Used////////////////
exports.collectionUpload = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'featuredImg', maxCount: 1 },
])
exports.profileUpload = upload.single('profileImage')
exports.uploadDataOnIpfs = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'compressedFile', maxCount: 1 },
])

//////////
// ipfs
const { create } = require('ipfs-http-client')
const { ipfsServerUrl, ipfsBaseUrl, pinataJWT } = require('../../config/vars')
const ipfs = create(ipfsServerUrl)

exports.addImage = async (data) => {
    const fileAdded = await ipfs.add(data)
    const imgHash = fileAdded.cid.toString()
    return `${ipfsBaseUrl}${imgHash}`
}
exports.uploadFileToIpfs = async (formData) => {
    // console.log('formData=====>', formData.get('file'));
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary= ${formData._boundary}`,
                Authorization: `Bearer ${pinataJWT}`,
                // pinata_api_key: `${process.env.REACT_APP_PINATA_API_KEY}`,
                // pinata_secret_api_key: `${process.env.REACT_APP_PINATA_API_SECRET}`,
            },
        })
        // console.log('response=========>', response);
        return response
    } catch (err) {
        return err
    }
}
exports.addContent = async (data) => {
    const doc = JSON.stringify(data)
    const dataAdded = await ipfs.add(doc)
    const dataHash = dataAdded.cid.toString()
    return `${ipfsBaseUrl}${dataHash}`
}
