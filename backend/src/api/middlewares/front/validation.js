const Joi = require('@hapi/joi')

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

const validateSignUpSchema = (data) => {
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
    return schema.validate(data, options)
}
const validateAddress = (address) => {
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
    return schema.validate(address, options)
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
const validateUser = (user) => {
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
    return schema.validate(user, options)
}

const validateUserProfile = (data) => {
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
    return schema.validate(data, options)
}

const validateId = (id) => {
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
