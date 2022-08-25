const Joi = require('@hapi/joi')

const validateAddNftToken = (add) => {
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
    return schema.validate(add, options)
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
