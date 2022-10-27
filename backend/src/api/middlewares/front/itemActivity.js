const Joi = require('@hapi/joi')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateCreateItemActivity = (req,res,next) => {
    const schema = Joi.object().keys({
        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        toAddress: Joi.string().allow(null),
        fromAddress:Joi.string().allow(null),
        price: Joi.number().allow(null),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        activityType: Joi.string()
            .valid('Mint', 'List', 'Bid', 'Transfer')
            .required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body

    const{error} = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}


const validateUpdateItemActivity = (req,res,next) => {
    const schema = Joi.object().keys({
        activityId: Joi.string().alphanum().min(12).max(24).required(),

        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        toAddress: Joi.string().required(),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        activityType: Joi.string()
            .valid('Mint', 'List', 'Bid', 'Transfer')
            .required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body
    const{error} = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateNFTid = (req,res,next) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = {
        nftId: req.query.nftId,
    }
    const{error} = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
module.exports = {
    validateCreateItemActivity,
    validateUpdateItemActivity,
    validateNFTid,
}
