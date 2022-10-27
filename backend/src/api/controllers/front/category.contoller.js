const Category = require('../../models/categories.model')
const { SUCCESS_MESSAGE, SUCCESS_STATUS } = require('../../../config/constants')
exports.list = async (req, res, next) => {
    try {
        let categories = await Category.find({
            status: true,
        }).sort({
            name: 1,
        })
        let updatedCollections = []
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].name !== 'Default Collection') {
                updatedCollections.push(categories[i])
            }
        }

        const total = updatedCollections ? updatedCollections?.length : 0
        return res.status(200).send({
            success: SUCCESS_STATUS.TRUE,
            message: SUCCESS_MESSAGE.CATEGORIES_FETCHED,
            updatedCollections,
            count: total,
        })
    } catch (error) {
        return next(error)
    }
}
