const Joi = require('@hapi/joi')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

const validateContractSchema = (contract) => {
    const schema = Joi.object().keys({
        name: Joi.string().max(50).required(),
        description: Joi.string().max(600).allow(''),
        symbol: Joi.string().max(50).allow(''),
        externalLink: Joi.string().allow(''),
        attributes: Joi.array().items({
            name: Joi.string().allow(''),
            value: Joi.string().allow(''),
        }),

        blockchainType: Joi.string().required(),

        levels: Joi.array().items({
            name: Joi.string().allow(''),
            value: Joi.number().allow(''),
            total: Joi.number().allow(''),
        }),
        email: Joi.string()
            .strict()
            .trim()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    return schema.validate(contract, options)
}

const validateSignUpSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        address: Joi.string().max(600).required(),
        email: Joi.string()
            .strict()
            .trim()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required(),
        username: Joi.string().max(50).required(),
        isApproved: Joi.boolean(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = {
        address: req.body.address,
        username: req.body.username,
        email: req.body.email,
        isApproved: req.body.isApproved,
    }

    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
const validateAddress = (req, res, next) => {
    const schema = Joi.object().keys({
        address: Joi.string().max(600).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    let payload = {
        address: req.body.address,
    }
    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
const validateEmail = (email) => {
    const schema = Joi.object().keys({
        email: Joi.string()
            .strict()
            .trim()
            .email({
                minDomainSegments: 2,
                tlds: { allow: ['com', 'net'] },
            })
            .required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    return schema.validate(email, options)
}
const validateUser = (req, res, next) => {
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
    let { userId } = req.params

    const payload = { userId }

    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateUserProfile = async (req, res, next) => {
    console.log('testing', req, req.user)
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        email: Joi.string().email().allow(''),
        username: Joi.string().max(50).allow(''),
        bio: Joi.string().max(500).allow(''),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    let payload = {
        userId: req.user,
        email: req.body.email,
        username: req.body.username,
        bio: req.body.bio,
    }
    // const payload = req.body
    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateId = (req, res, next) => {
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
    const { offerId } = req.params

    const { error } = schema.validate({ offerId }, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateAucthentication = (data) => {
    const schema = Joi.object().keys({
        id: Joi.string().alphanum().min(12).max(24).required(),
        address: Joi.string().max(600).required(),
        nounce: Joi.number().required(),
        signature: Joi.string().required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    return schema.validate(data, options)
}

module.exports = {
    validateContractSchema,
    validateEmail,
    validateSignUpSchema,
    validateAddress,
    validateUser,
    validateUserProfile,
    validateId,
    validateAucthentication,
}
