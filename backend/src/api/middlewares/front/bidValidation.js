const Joi = require('@hapi/joi').extend(require('@joi/date'))
const {
    SUCCESS_MESSAGE,
    ERROR_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validateCreateBid = (req,res,next) => {
    const schema = Joi.object().keys({
        bidBy: Joi.string().alphanum().min(12).max(24).required(),
        ownerId: Joi.string().alphanum().min(12).max(24).required(),
        nftId: Joi.string().alphanum().min(12).max(24).required(),
        bidAmount: Joi.number().required(),
        isAccepted: Joi.boolean().default(false),
        auctionId: Joi.string().alphanum().min(12).max(24).required(),
        expiryDate: Joi.date().allow(''),
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
    const payload = {
        bidBy: req.body.bidBy,
        ownerId: req.body.ownerId,
        nftId: req.body.nftId,
        bidAmount: req.body.bidAmount,
        isAccepted: req.body.isAccepted,
        expiryDate: req.body.expiryDate,
        fromAddress: req.body.fromAddress,
        toAddress: req.body.toAddress,
        auctionId: req.body.auctionId,
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

const validateBidId = (req,res,next) => {
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
 
   

  
    const { error } =  schema.validate({bidId}, options)
    if (error) {
        return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.FALSE,
            message: error?.details[0]?.message,
        })
    }
    next()
}

module.exports = {
    validateCreateBid,
    validateBidId,
}
