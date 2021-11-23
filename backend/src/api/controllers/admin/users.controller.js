const ObjectId = require('mongoose').Types.ObjectId
const User = require('../../models/users.model')
const { userDefaultImage } = require('../../../config/vars')

// API to get users list
exports.list = async (req, res, next) => {
    try {
        let { page, limit } = req.query

        page = page !== undefined && page !== '' ? parseInt(page) : 1
        limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

        const total = await User.countDocuments({})

        if (page > Math.ceil(total / limit) && total > 0)
            page = Math.ceil(total / limit)

        const users = await User.aggregate([
            { $sort: { createdAt: -1 } },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    _id: 1, username: 1, email: 1, address: 1,
                    description: 1, emailVerified: 1, facebookLink: 1, twitterLink: 1, gPlusLink: 1, vineLink: 1,
                    profileImage: 1 //{ $ifNull: ['$profileImage', userDefaultImage] }
                }
            }
        ])

        return res.send({
            success: true, message: 'Users fetched successfully',
            data: {
                users,
                pagination: {
                    page, limit, total,
                    pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit)
                }
            }
        })
    } catch (error) {
        return next(error)
    }
}

// API to delete user
exports.delete = async (req, res, next) => {
    try {
        const { userId } = req.params
        if (userId) {
            const user = await User.deleteOne({ _id: userId })
            if (user && user.deletedCount)
                return res.send({ success: true, message: 'User deleted successfully', userId })
            else return res.status(400).send({ success: false, message: 'User not found for given Id' })
        } else
            return res.status(400).send({ success: false, message: 'User Id is required' })
    } catch (error) {
        return next(error)
    }
}