const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateNFTSchema = (req,res,next) => {
    const schema = Joi.object().keys({
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().min(3).max(500).required(),
        creatorId: Joi.string().alphanum().min(12).max(24).allow(''),
        properties: Joi.array().items({
            name: Joi.string().max(40).allow(''),
            type: Joi.string().max(40).allow(''),
        }),
        levels: Joi.array().items({
            name: Joi.string().max(40).allow(''),
            value: Joi.number().valid(1, 2, 3, 4, 5).allow(''),
            total: Joi.number().valid(5).allow(''),
        }),
        stats: Joi.array().items({
            name: Joi.string().max(40).allow(''),
            value: Joi.number().valid(1, 2, 3, 4, 5).allow(''),
            total: Joi.number().valid(5).allow(''),
        }),
        fileType: Joi.string().valid('image', 'audio', 'video').required(),
        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        currentPrice: Joi.number().min(0).max(1000000).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
        collectionId: Joi.string().alphanum().min(12).max(24).required(),
        ownerAddress: Joi.string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .allow(''),

        copies: Joi.number().min(1).max(1000000).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = {
        name: req.body.name,
        description: req.body.description,
        properties: JSON.parse(req.body.properties),
        levels: JSON.parse(req.body.levels),
        stats: JSON.parse(req.body.stats),
        fileType: req.body.fileType,
        ownerId: req.body.ownerId,
        userId: req.body.userId,
        collectionId: req.body.collectionId,
        categoryId: req.body.categoryId,
        currentPrice: 0,
        ownerAddress: req.body.ownerAddress,
        copies: req.body.copies,
        activeAuction: req.body.activeAuction,
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
const validateEditNftSchema = (data) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().min(1).max(150).required(),
        fileType: Joi.string().valid('image', 'audio', 'video').required(),
        attributes: Joi.array().items({
            name: Joi.string().max(30).allow(''),
            value: Joi.string().allow(''),
        }),
        levels: Joi.array().items({
            name: Joi.string().max(30).allow(''),
            value: Joi.number().allow(''),
            total: Joi.number().min(1).max(5).allow(''),
        }),
        stats: Joi.array().items({
            name: Joi.string().max(30).allow(''),
            value: Joi.number().allow(''),
            total: Joi.number().min(1).max(5).allow(''),
        }),

        collectionId: Joi.string().alphanum().min(12).max(24).required(),
        currentPrice: Joi.number().required(),
        ownerAddress: Joi.string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .allow(''),
        copies: Joi.number().min(1).max(100000).required(),
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

const validateNftId = (req,res,next) => {
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
    const {nftId} = req.params
    const payload = {
        nftId
    }
    const {error} = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

module.exports = {
    validateNFTSchema,
    validateEditNftSchema,
    validateNftId,
}
