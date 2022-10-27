const Offer = require('../../models/offer.model')
const ObjectId = require('mongoose').Types.ObjectId
// const validation = require('../../middlewares/front/offerValidation')
const validator = require('../../middlewares/front/validation')
const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
// API to create offer
exports.create = async (req, res, next) => {
    try {
        const payload = req.body

        // const { error } = validation.validateOfferSchema(payload)

        // if (error) {
        //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
        //         success: SUCCESS_STATUS.FALSE,
        //         message: error?.details[0]?.message,
        //     })
        // }
        const offer = await Offer.create(payload)

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.OFFER_MADE_SUCCESSFULLY,
            offer,
        })
    } catch (error) {
        return next(error)
    }
}

// API to delete offer
exports.delete = async (req, res, next) => {
    try {
        const { offerId } = req.params

        // const { error } = validator.validateId({ offerId })
        // if (error) {
        //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
        //         success: SUCCESS_STATUS.FALSE,
        //         message: error?.details[0]?.message,
        //     })
        // }

        const offer = await Offer.deleteOne({ _id: offerId })
        if (offer && offer.deletedCount)
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.OFFER_CANCELLED,
            })
        else
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.OFFER_NOT_FOUND,
            })
    } catch (error) {
        return next(error)
    }
}

// API to get offers list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query
        const { nftId } = req.query

        const filter = { isExpired: false, isAccepted: false }

        if (nftId) filter.nftId = ObjectId(nftId)

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = Offer.countDocuments(filter)

        const offers = Offer.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
        ])

        const offerList = await Promise.all([total, offers])

        return res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.OFFERS_FETCHED,
            data: {
                offers: offerList[1],
                pagination: {
                    page,
                    limit,
                    total: offerList[0],
                    pages:
                        Math.ceil(offerList[0] / limit) <= 0
                            ? 1
                            : Math.ceil(offerList[0] / limit),
                },
            },
        })
    } catch (error) {
        return next(error)
    }
}

// API to accept offer
exports.accept = async (req, res, next) => {
    try {
        const { offerId } = req.body
        // const { error } = validator.validateId({ offerId })
        // if (error) {
        //     return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
        //         success: SUCCESS_STATUS.FALSE,
        //         message: error?.details[0]?.message,
        //     })
        // }

        const offer = await Offer.findOneAndUpdate(
            { _id: offerId },
            { isAccepted: true },
            { new: true }
        )

        if (!offer || offer === null) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: ERROR_MESSAGE.OFFER_NOT_FOUND,
            })
        } else
            return res.status(HTTP_STATUS_CODE.OK).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.OFFER_ACCEPTED,
            })
    } catch (error) {
        return next(error)
    }
}
