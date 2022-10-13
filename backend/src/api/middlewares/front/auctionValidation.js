const Joi = require('@hapi/joi').extend(require('@joi/date'))

const validateNFTFixedTAuctionSchema = (data) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        copiesForAuction: Joi.number().min(0).max(100000).required(),
        sellId: Joi.number(),
        sellerTradeState: Joi.string(),
        sellingMethod: Joi.number().valid(1, 2).required(),
        signature: Joi.string(),
        blockchainType: Joi.string(),
        sellingConfig: Joi.object()
            .keys({
                price: Joi.object()
                    .keys({
                        currency: Joi.string().required(),
                        amount: Joi.number().max(100000).invalid(0).required(),
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
    return schema.validate(data, options)
}

const validateNFTimedTAuctionSchema = (data) => {
    const schema = Joi.object().keys({
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        userId: Joi.string().alphanum().min(12).max(24).required(),
        auctionStartDate: Joi.date().allow(''),
        sellId: Joi.number().required(),
        auctionEndDate: Joi.date().allow(''),
        copiesForAuction: Joi.number().min(1).max(100000).required(),
        sellingMethod: Joi.number().valid(1, 2).required(),
        sellingConfig: Joi.object()
            .keys({
                startPrice: Joi.object()
                    .keys({
                        currency: Joi.string().required(),
                        amount: Joi.number().max(100000).invalid(0).required(),
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
    return schema.validate(data, options)
}

const validateBuyNowSchema = (data) => {
    const schema = Joi.object().keys({
        userId: Joi.string().alphanum().min(12).max(24).required(),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        ownerAddress: Joi.string()
            // .regex(/^0x[a-fA-F0-9]{40}$/)
            .required(),
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

const validateAuctionEndSchema = (data) => {
    const schema = Joi.object().keys({
        auctionId: Joi.string().alphanum().min(12).max(24).required(),
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
    validateNFTFixedTAuctionSchema,
    validateNFTimedTAuctionSchema,
    validateAuctionEndSchema,
    validateBuyNowSchema,
}
