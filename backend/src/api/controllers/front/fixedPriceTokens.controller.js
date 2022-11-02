const FixedPriceTokens = require('../../models/fixedPriceTokens.model')
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
exports.addNftToken = async (req, res) => {
    try {
        const payload = req.body

        const result = await FixedPriceTokens.create(payload)

        res.send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.ADD_NFT_TOKEN_FIXED_PRICE,
            data: result,
        })
    } catch (err) {
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.ADD_NFT_TOKEN_FIXED_PRICE_FAILED,
            error: err,
        })
    }
}

exports.getNftTokens = async (req, res) => {
    try {
        const result = await FixedPriceTokens.find()

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_TOKEN_FIXED_PRICE_LIST,
            data: result,
        })
    } catch (err) {
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.NFT_TOKEN_FIXED_PRICE_LIST_FAILED,
            error: err,
        })
    }
}

exports.getNftToken = async (req, res) => {
    const id = req.params.id

    try {
        const result = await FixedPriceTokens.findOne({ nftId: id })

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.NFT_TOKEN_FIXED_PRICE_FOR_NFT,
            data: result,
        })
    } catch (err) {
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: ERROR_MESSAGE.NFT_TOKEN_FIXED_PRICE_FOR_NFT_FAILED,
            error: err,
        })
    }
}
