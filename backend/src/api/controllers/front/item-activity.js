const ItemActivity = require('../../models/item-activity.modal')
const mongoose = require('mongoose')
const validation = require('../../middlewares/front/itemActivity')
exports.create = async (req, res, next) => {
    try {
        let payload = req.body
        const { error } = validation.validateCreateItemActivity(payload)

        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }

        const result = await ItemActivity.create(payload)
        if (result) {
            res.status(200).send({
                success: true,
                message: 'Item Activity Created Successfully',
                data: result,
            })
        }
    } catch (error) {
        return next(error)
    }
}

exports.get = async (req, res, next) => {
    try {
        let payload = {
            nftId: req.query.nftId,
        }
        const { error } = validation.validateNFTid(payload.nftId)

        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }
        let activities = await ItemActivity.find(payload)

        res.status(200).send({
            success: true,
            message: 'Item Activity Retrieved Successfully',
            data: activities,
        })
    } catch (error) {
        return next(error)
    }
}

exports.update = async (req, res, next) => {
    try {
        let payload = req.body

        const { error } = validation.validateCreateItemActivity(payload)

        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }
        const updatedActivity = await ItemActivity.findByIdAndUpdate(
            { _id: payload.id },
            { $set: payload },
            { new: true }
        )
        res.status(200).send({
            success: true,
            message: 'NFT Deleted Successfully',
            data: updatedActivity,
        })
    } catch (error) {
        return next(error)
    }
}

exports.delete = async (req, res, next) => {
    try {
        let nftId = req.body.nftId
        nftId = mongoose.Types.ObjectId(nftId)
        const { error } = validation.validateNFTid(nftId)

        if (error) {
            let errorMsg = error.details[0].message
            return res.status(400).send({ status: false, message: errorMsg })
        }

        let result = await ItemActivity.deleteMany({ nftId: nftId })
        if (result) {
            res.status(200).send({
                success: true,
                message: 'NFT Deleted Successfully',
            })
        }
    } catch (error) {
        return next(error)
    }
}
