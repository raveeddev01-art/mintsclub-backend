const NftTokens = require('../../models/nftTokens.model')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

exports.addNftToken = async (req, res, next) => {
    try {
        const payload = req.body

        const nftToken = await NftTokens.create(payload)

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.TOKEN_ADDED_FOR_NFT,
            data: nftToken,
        })
    } catch (err) {
        return next(err)
    }
}

exports.getNftTokens = async (req, res) => {
    try {
        const nftTokens = await NftTokens.find()

        res.status(200).send({
            success: SUCCESS_STATUS.TRUE,
            MESSAGE: SUCCESS_MESSAGE.NFT_FETCHED,
            data: nftTokens,
        })
    } catch (err) {
        res.status(400).send({
            success: SUCCESS_STATUS.FALSE,
            error: err,
        })
    }
}
