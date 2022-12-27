const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

exports.get = async (req, res, next) => {
    const { collectionId } = req.query

    try {
        const filter = {
            sellingMethod: 1, // timed auctions only
            collectionId: ObjectId(collectionId),
        }
        const itemsListing = await NFT.aggregate([
            {
                $match: filter,
            },
        ])

        res.status(HTTP_STATUS_CODE.OK).send({
            success: SUCCESS_STATUS.TRUE,
            data: itemsListing,
            message: SUCCESS_MESSAGE.ITEM_LISTING_FETCHED,
        })
    } catch (err) {
        next(err)
    }
}
