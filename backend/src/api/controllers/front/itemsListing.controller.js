const NFT = require('../../models/nfts.model')
const ObjectId = require('mongoose').Types.ObjectId
const validation = require('../../middlewares/front/collectionValidation')
exports.get = async (req, res, next) => {
    let { collectionId } = req.query
    const { error } = validation.validateCollectionId(collectionId)
    if (error) {
        let errorMsg = error.details[0].message
        return res.status(400).send({ status: false, data: errorMsg })
    }
    try {
        let filter = {
            sellingMethod: 1, // timed auctions only
            collectionId: ObjectId(collectionId),
        }
        const itemsListing = await NFT.aggregate([
            {
                $match: filter,
            },
        ])

        res.status(200).send({
            success: true,
            data: itemsListing,
            message: 'Items Listing Retrieved Successfully',
        })
    } catch (err) {
        next(err)
    }
}
