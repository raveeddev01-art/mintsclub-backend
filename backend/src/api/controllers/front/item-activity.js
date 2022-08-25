const ItemActivity = require('../../models/item-activity.modal')
// const mongoose = require('mongoose')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
const validation = require('../../middlewares/front/itemActivity')
exports.create = async (req, res, next) => {
    try {
        const payload = req.body
        const { error } = validation.validateCreateItemActivity(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        const result = await ItemActivity.create(payload)
        if (result) {
            res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.ITEM_ACTIVITY__CREATED,
                data: result,
            })
        }
    } catch (error) {
        return next(error)
    }
}

exports.get = async (req, res, next) => {
    try {
        const payload = {
            nftId: req.query.nftId,
        }
        const { error } = validation.validateNFTid(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        const activities = await ItemActivity.find(payload)

        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.ITEM_ACTIVITY__FETCHED,
            data: activities,
        })
    } catch (error) {
        return next(error)
    }
}

exports.update = async (req, res, next) => {
    try {
        const payload = req.body
        const { error } = validation.validateUpdateItemActivity(payload)

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }
        const updatedActivity = await ItemActivity.findByIdAndUpdate(
            { _id: payload?.activityId },
            { $set: payload },
            { new: true }
        )
        res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.ITEM_ACTIVITY__UPDATED,
            data: updatedActivity,
        })
    } catch (error) {
        return next(error)
    }
}

exports.delete = async (req, res, next) => {
    try {
        const nftId = req.body.nftId
        const { error } = validation.validateNFTid({ nftId })

        if (error) {
            return res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.FALSE,
                message: error?.details[0]?.message,
            })
        }

        let result = await ItemActivity.deleteMany({ nftId: nftId })
        if (result) {
            res.status(HTTP_STATUS_CODE.BAD_REQUEST).send({
                success: SUCCESS_STATUS.TRUE,
                message: SUCCESS_MESSAGE.ITEM_ACTIVITY__FETCHED_DELETED,
            })
        }
    } catch (error) {
        return next(error)
    }
}
