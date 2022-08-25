const Joi = require('@hapi/joi')

const validateCreateItemActivity = (add) => {
    const schema = Joi.object().keys({
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
    return schema.validate(add, options)
}

const validateUpdateItemActivity = (add) => {
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
    return schema.validate(add, options)
}

const validateNFTid = (id) => {
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
    return schema.validate(id, options)
}
module.exports = {
    validateCreateItemActivity,
    validateUpdateItemActivity,
    validateNFTid,
}
