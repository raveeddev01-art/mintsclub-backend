const Joi = require('@hapi/joi')

const validateCollectionSchema = (data) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
        name: Joi.string().min(1).max(55).required(),
        url: Joi.string().allow(''),
        description: Joi.string().min(3).max(500).allow(''),
        ownerAddress: Joi.string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        deploy: Joi.boolean().default(false),
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
const validateEditCollectionSchema = (data) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        _id: Joi.string().alphanum().min(12).max(24).required(),
        categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
        name: Joi.string().min(1).max(100).required(),
        url: Joi.string().allow(''),
        description: Joi.string().min(1).max(150).allow(''),
        // category: Joi.string().allow(''),
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

const validateCollectionId = (collectionId) => {
    const schema = Joi.object().keys({
        collectionId: Joi.string().alphanum().min(12).max(24).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    return schema.validate(collectionId, options)
}
module.exports = {
    validateCollectionSchema,
    validateEditCollectionSchema,
    validateCollectionId,
}
