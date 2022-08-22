const Category = require('../../models/categories.model')

exports.list = async (req, res, next) => {
    try {
        const categories = await Category.find({ status: true }).sort({
            name: 1,
        })

        let total = 0

        total = categories.length
        return res.status(200).send({
            status: true,
            message: 'Categories fetched successfully',
            categories,
            count: total,
        })
    } catch (error) {
        return next(error)
    }
}
