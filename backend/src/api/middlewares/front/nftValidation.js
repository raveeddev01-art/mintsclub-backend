const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateNFTSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        blockchainType: Joi.string()
            .required()
            .valid('ethereum', 'solana', 'bsc', 'polygon'),
        name: Joi.string().min(1).max(100).required(),
        description: Joi.string().min(3).max(500).required(),
        creatorId: Joi.string().alphanum().min(12).max(24).allow(''),
        properties: Joi.array().items({
            name: Joi.string().max(10).allow(''),
            type: Joi.string().max(10).allow(''),
        }),

        levels: Joi.array().items({
            name: Joi.max(10).allow(''),
            value: Joi.allow(''),
            total: Joi.allow(''),
        }).optional(),
        stats: Joi.array().items({
            name: Joi.max(10).allow(''),
            value: Joi.allow(''),
            total: Joi.allow(''),
        }).optional(),
        creators: Joi.array().items({
            address: Joi.string().allow(''),
            share: Joi.number().allow(''),
        }),
        sellerFeeBasisPoints: Joi.number().optional(),
        // fileType: Joi.string().valid('image', 'audio', 'video').required(),
        fileType: Joi.alternatives().conditional('blockchainType', [
            {
                is: 'ethereum',
                then: Joi.string().valid('image', 'audio', 'video').required(),
            },
            {
                is: 'polygon',
                then: Joi.string().valid('image', 'audio', 'video').required(),
            },
            {
                is: 'bsc',
                then: Joi.string().valid('image', 'audio', 'video').required(),
            },
            {
                is: 'solana',
                then: Joi.optional(),
            },
        ]),
        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        // currentPrice: Joi.number().min(0).max(1000000).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
        collectionId: Joi.string().alphanum().min(12).max(24).required(),

        ownerAddress: Joi.alternatives().conditional('blockchainType', [
            {
                is: 'ethereum',
                then: Joi.string()
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                    .allow(''),
            },
            {
                is: 'polygon',
                then: Joi.string()
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                    .allow(''),
            },
            {
                is: 'bsc',
                then: Joi.string()
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                    .allow(''),
            },
            {
                is: 'solana',
                then: Joi.string().allow(''),
            },
        ]),

        copies: Joi.alternatives().conditional('blockchainType', [
            {
                is: 'ethereum',
                then: Joi.number().min(1).required(),
            },
            {
                is: 'polygon',
                then: Joi.number().min(1).required(),
            },
            {
                is: 'bsc',
                then: Joi.number().min(1).required(),
            },
            {
                is: 'solana',
                then: Joi.optional(),
            },
        ]),
        collection: Joi.object().optional(),
        contractAddress: Joi.string().optional(),
        isApproved: Joi.boolean().required(),
        image: Joi.string().optional(),
        compressedFile: Joi.optional(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    let payload = {
        ...req.body,
    }

    payload.properties = JSON.parse(req.body?.properties)
    payload.levels = JSON.parse(req.body?.levels)
    payload.stats = JSON.parse(req.body?.stats)
    if (req.body?.creators) {
        payload.creators = JSON.parse(req.body?.creators)
    }
    if (req.body?.sellerFeeBasisPoints) {
        payload.sellerFeeBasisPoints = req.body?.sellerFeeBasisPoints
    }
    payload.collection = JSON.parse(payload?.collection)
    payload.copies = Number(payload?.copies)

    const { error } = schema.validate(payload)

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
        description: Joi.string().min(1).max(500).required(),
        fileType: Joi.string().valid('image', 'audio', 'video').required(),
        attributes: Joi.array().items({
            name: Joi.string().max(10).allow(''),
            value: Joi.string().allow(''),
        }),
        levels: Joi.array().items({
            name: Joi.string().max(10).allow(''),
            value: Joi.number().allow(''),
            total: Joi.number().min(1).max(5).allow(''),
        }),
        stats: Joi.array().items({
            name: Joi.string().max(10).allow(''),
            value: Joi.number().allow(''),
            total: Joi.number().min(1).max(5).allow(''),
        }),

        collectionId: Joi.string().alphanum().min(12).max(24).required(),
        currentPrice: Joi.number().required(),
        ownerAddress: Joi.string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .allow(''),
        copies: Joi.number().min(1).required(),
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

const validateNftId = (req, res, next) => {
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
    const { nftId } = req.params
    const payload = {
        nftId,
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

module.exports = {
    validateNFTSchema,
    validateEditNftSchema,
    validateNftId,
}
