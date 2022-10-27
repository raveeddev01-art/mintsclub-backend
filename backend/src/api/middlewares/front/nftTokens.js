const Joi = require('@hapi/joi')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateAddNftToken = (req,res,next) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        nftToken: Joi.string().required(),
        tokenStandard: Joi.string().required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body
    const {error} = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateNFTid = (id) => {
    const schema = Joi.object().keys({
        id: Joi.string().alphanum().min(12).max(24).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    return schema.validate(id, options)
}
module.exports = {
    validateAddNftToken,
    validateNFTid,
}
