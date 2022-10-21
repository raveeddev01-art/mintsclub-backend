const Joi = require('@hapi/joi')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

const validateLikesDislikeSchema = (req,res,next) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        // count: Joi.number().required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const Payload = {
        nftId: req.body.nftId,
        userId: req.body.userId,
    }
    const {error}= schema.validate(Payload, options)
    if(error){
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next();
}

const validateId = (id) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
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
    validateLikesDislikeSchema,
    validateId,
}
