const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateCreateBid = (req, res, next) => {
    const schema = Joi.object().keys({
        bidBy: Joi.string().alphanum(),

        ownerId: Joi.string().alphanum(),

        nftId: Joi.string().alphanum(),

        bidAmount: Joi.number().required(),
        blockchainType: Joi.string()
            .required()
            .valid('ethereum', 'solana', 'bsc', 'polygon', 'algorand'),
        isAccepted: Joi.boolean().default(false),
        auctionId: Joi.string().alphanum(),

        expiryDate: Joi.date().allow(''),

        globalState: Joi.alternatives().conditional('blockchainType', [
            {
                is: 'ethereum',
                then: Joi.object().optional(),
            },
            {
                is: 'polygon',
                then: Joi.object().optional(),
            },
            {
                is: 'bsc',
                then: Joi.object().optional(),
            },
            {
                is: 'solana',
                then: Joi.object().optional(),
            },
            {
                is: 'algorand',
                then: Joi.object().required(),
            },
        ]),

        fromAddress: Joi.string()
            // .regex(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        toAddress: Joi.string()
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

    const payload = req.body

    const { error } = schema.validate(payload, options)
    console.log(
        '🚀 ~ file: bidValidation.js ~ line 36 ~ validateCreateBid ~ error',
        error
    )
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

const validateBidId = (req, res, next) => {
    const schema = Joi.object().keys({
        bidId: Joi.string().alphanum().min(12).max(24).required(),
    })
    const options = {
        errors: {
            wrap: {
                label: '',
            },
        },
    }
    const { bidId } = req.params

    const { error } = schema.validate({ bidId }, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}
const validateBidUpdateSchema = (data) => {
    const schema = Joi.object().keys({
        bidId: Joi.string().alphanum().min(12).max(24).required(),
        bidStatus: Joi.string().required(),
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
    validateCreateBid,
    validateBidId,
    validateBidUpdateSchema,
}
