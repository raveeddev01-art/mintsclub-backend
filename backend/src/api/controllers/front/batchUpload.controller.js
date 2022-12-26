/* eslint-disable no-unused-expressions */
const BatchUpload = require('../../models/batchUpload.model')

exports.batchUpload = async (req, res, next) => {
    try {
        let payload = {
            key: req.body.key,
            fileName: req.body.fileName,
            collectionId: req.body.collectionId,
            blockchainType: req.body.blockchainType,
            categoryId: req.body.categoryId,
            status: req.body.status,
            ownerAddress: req.body.ownerAddress,
            userId: req.body.userId,
            location: req.body.location,
        }

        let blockchainType = payload?.blockchainType
        const result = await BatchUpload.create(payload)

        if (!result) {
            return res.status(200).send({
                success: false,
                message: 'Please follow file upload standards',
            })
        }
        return res.status(200).send({
            success: true,
            message: 'File is uploaded and added to cronJob.',
        })
    } catch (err) {
        next(err)
    }
}

const isDirExist = (fileName) => {
    if (fs.existsSync(`./src/uploads/files/${fileName}/`)) {
        return true
    } else {
        return false
    }
}

const setStatus = async (id, status) => {
    await BatchUpload.findByIdAndUpdate({ _id: id }, { $set: { status } })
    return true
}

const removeDirctory = (fileName) => {
    fs.rmdir(
        `./src/uploads/files/${fileName}`,
        { recursive: true },
        async (err) => {
            if (err) {
                throw err
            }
            return true
        }
    )
}
