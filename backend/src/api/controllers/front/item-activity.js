const ItemActivity = require('../../models/item-activity.modal')
const {
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')
exports.create = async (req, res, next) => {
    try {
        const payload = req.body
        const result = await ItemActivity.create(payload)
        if (result) {
            res.status(HTTP_STATUS_CODE.OK).send({
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
            activityType: { $ne: 'Bid' },
        }
        const activities = await ItemActivity.find(payload)
        

        res.status(HTTP_STATUS_CODE.OK).send({
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

        let result = await ItemActivity.deleteMany({ nftId })
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
