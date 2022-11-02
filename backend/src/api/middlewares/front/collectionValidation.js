const Joi = require('@hapi/joi')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateCollectionSchema = (req,res,next) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
        name: Joi.string().min(1).max(55).required(),
        url: Joi.string().allow(''),
        description: Joi.string().min(3).max(500).allow(''),
        isApproved:Joi.boolean().required(),
        ownerAddress: Joi.string()
            // .regex(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        deploy: Joi.boolean().default(false),
        abi: Joi.required().allow(null),
        contractAddress: Joi.required().allow(''),
        blockchainType: Joi.string().required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    let payload = {
        userId: req.body.userId,
        categoryId: req.body.categoryId,
        name: req.body.name,
        url: req.body.url,
        description: req.body.description,
        ownerAddress: req.body.ownerAddress,
        deploy: req.body.deploy ? req.body.deploy : false,
        abi: req.body.abi ? req.body.abi : null,
        contractAddress: req.body.contractAddress
            ? req.body.contractAddress
            : '',
        blockchainType: req.body.blockchainType,
        isApproved : req.body.isApproved
    }
    const { error } =  schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
const validateEditCollectionSchema = (req,res,next) => {
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
    let payload = {
        userId: req.body.userId,
        _id: req.body._id,
        categoryId: req.body.categoryId,
        name: req.body.name,
        url: req.body.url,
        description: req.body.description,
    }
    const { error } =  schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateCollectionId = (req,res,next) => {
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
    const { collectionId } = req.params

    const{error} = schema.validate({collectionId} , options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
module.exports = {
    validateCollectionSchema,
    validateEditCollectionSchema,
    validateCollectionId,
}
