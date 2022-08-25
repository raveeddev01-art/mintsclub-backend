const Category = require('../../models/categories.model')
const { SUCCESS_MESSAGE, SUCCESS_STATUS } = require('../../../config/constants')
exports.list = async (req, res, next) => {
    try {
        const categories = await Category.find({ status: true }).sort({
            name: 1,
        })

        const total = categories ? categories?.length : 0
        return res.status(200).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.CATEGORIES_FETCHED,
            categories,
            count: total,
        })
    } catch (error) {
        return next(error)
    }
}
