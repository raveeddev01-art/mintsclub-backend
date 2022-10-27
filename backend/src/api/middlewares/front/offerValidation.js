const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

const validateOfferSchema = (req,res,next) => {
    const schema = Joi.object().keys({
        fromAddress: Joi.string().required(),
        toAddress: Joi.string().required(),
        offerBy: Joi.string().alphanum().min(12).max(24).required(),
        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        nftId: Joi.string().required(),
        price: Joi.number().required(),
        isAccepted: Joi.boolean().required(),
        isExpired: Joi.boolean().required(),
        // expiryDate:Joi.date().allow(null)
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body
    const{error} = schema.validate(payload,options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next();
}

module.exports = {
    validateOfferSchema,
}
