const NFT = require('../../models/nfts.model')
const Offer = require('../../models/offer.model')
const ObjectId = require('mongoose').Types.ObjectId
const validation = require('../../middlewares/front/offerValidation')
const validator = require('../../middlewares/front/validation')
// API to create offer
exports.create = async (req, res, next) => {
    try {
        let payload = req.body

        const { error } = validation.validateOfferSchema(payload)

        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }
        const offer = await Offer.create(payload)

        return res.send({
            success: true,
            message: 'You have made offer successfully',
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
        let payload = {
            id: offerId,
        }
        const { error } = validator.validateId(payload)
        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }
        if (offerId) {
            const offer = await Offer.deleteOne({ _id: offerId })
            if (offer && offer.deletedCount)
                return res.send({
                    success: true,
                    message: 'Your Offer has been cancelled successfully',
                })
            else
                return res.status(400).send({
                    success: false,
                    message: 'Offer not found for given Id',
                })
        } else
            return res
                .status(400)
                .send({ success: false, message: 'Offer Id is required' })
    } catch (error) {
        return next(error)
    }
}

// API to get offers list
exports.list = async (req, res, next) => {
    try {
        let { page, limit, nftId } = req.query
        let filter = { isExpired: false, isAccepted: false }

        if (nftId) filter.nftId = ObjectId(nftId)

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = await Offer.countDocuments(filter)

        const offers = await Offer.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
        ])

        return res.send({
            success: true,
            message: 'Offers fetched successfully',
            data: {
                offers: offers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages:
                        Math.ceil(total / limit) <= 0
                            ? 1
                            : Math.ceil(total / limit),
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
        const { error } = validator.validateId(offerId)
        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }

        if (offerId) {
            // accept offer
            const offer = await Offer.findByIdAndUpdate(
                { _id: offerId },
                { isAccepted: true },
                { new: true }
            )

            if (offer) {
                // expire other offers
                await Offer.updateMany(
                    { _id: { $ne: ObjectId(offerId) }, nftId: offer.nftId },
                    { $set: { isExpired: true } }
                )

                await NFT.updateOne(
                    { _id: offer.nftId },
                    {
                        $unset: {
                            sellingMethod: undefined,
                            sellingConfig: undefined,
                            auctionEndDate: undefined,
                            auctionEndTime: undefined,
                            auctionStartDate: undefined,
                            auctionStartTime: undefined,
                        },
                        $set: {
                            ownerId: offer.offerBy,
                        },
                    }
                )

                return res.send({
                    success: true,
                    message: 'Offer has been accepted successfully',
                })
            } else
                return res.status(400).send({
                    success: false,
                    message: 'Offer not found for given Id',
                })
        } else
            return res
                .status(400)
                .send({ success: false, message: 'Offer Id is required' })
    } catch (error) {
        return next(error)
    }
}
