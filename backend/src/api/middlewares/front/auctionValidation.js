const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
    ERROR_MESSAGE,
} = require('../../../config/constants')
const validateNFTFixedTAuctionSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        copiesForAuction: Joi.number().min(0).max(100000).required(),
        sellId: Joi.alternatives().conditional('blockchainType', {
            is: 'ethereum',
            then: Joi.string().required(),
        }),
        sellingMethod: Joi.number().valid(1, 2).required(),
        signature: Joi.string().optional(),
        blockchainType: Joi.string().required().valid('ethereum', 'solana'),
        txnHash: Joi.alternatives().conditional('blockchainType', {
            is: 'solana',
            then: Joi.string().required(),
        }),

        sellingConfig: Joi.object()
            .keys({
                price: Joi.object()
                    .keys({
                        currency: Joi.string().required(),
                        amount: Joi.number()
                            .max(10000000)
                            .invalid(0)
                            .required(),
                    })
                    .required(),
                // reserveFor: Joi.string().allow(''),
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
    // const sellingConfig = JSON.parse(req.body.sellingConfig)
    // const sellingMethod = req.body.sellingMethod
    // const payload = { ...req.body, sellingConfig, sellingMethod }
    const payload = req.body
    payload.sellingConfig = JSON.parse(payload.sellingConfig)

    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateNFTimedTAuctionSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        blockchainType: Joi.string().required().valid('ethereum', 'solana'),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        auctionStartDate: Joi.date().allow(''),
        // sellId: Joi.number().required(),
        sellId: Joi.alternatives().conditional('blockchainType', {
            is: 'ethereum',
            then: Joi.number().required(),
        }),

        auctionEndDate: Joi.date().allow(''),
        copiesForAuction: Joi.number().min(1).max(100000).required(),
        sellingMethod: Joi.number().valid(1, 2).required(),
        txnHash: Joi.alternatives().conditional('blockchainType', {
            is: 'solana',
            then: Joi.string().required(),
        }),
        highestBidder: Joi.alternatives().conditional('blockchainType', {
            is: 'solana',
            then: Joi.string().required(),
        }),
        sellerPublicKey: Joi.alternatives().conditional('blockchainType', {
            is: 'solana',
            then: Joi.string().required(),
        }),
        sellingConfig: Joi.object()
            .keys({
                startPrice: Joi.object()
                    .keys({
                        currency: Joi.string().required(),
                        amount: Joi.number().invalid(0).required(),
                    })
                    .required(),
                duration: Joi.object()
                    .keys({
                        startDate: Joi.date().required(),
                        endDate: Joi.date().required(),
                    })
                    .required(),
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
    // const sellingConfig = JSON.parse(req.body.sellingConfig)
    // const payload = { ...req.body, sellingConfig }
    const payload = req.body
    payload.sellingConfig = JSON.parse(payload.sellingConfig)

    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
const auctionValidation = (req, res, next) => {
    const sellingMethod = req.body.sellingMethod
    if (sellingMethod === 1) {
        validateNFTFixedTAuctionSchema(req, res, next)
    }
    if (sellingMethod === 2) {
        validateNFTimedTAuctionSchema(req, res, next)
    }
}

const validateBuyNowSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        ownerAddress: Joi.string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        tokenId: Joi.number().optional(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body
    const { error } = schema.validate(payload, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateAuctionEndSchema = (req, res, next) => {
    const schema = Joi.object().keys({
        auctionId: Joi.string().alphanum().min(12).max(24).required(),
        txnHash: Joi.string().optional(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const payload = req.body

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
    validateNFTFixedTAuctionSchema,
    validateNFTimedTAuctionSchema,
    validateAuctionEndSchema,
    validateBuyNowSchema,
    auctionValidation,
}
