const ObjectId = require('mongoose').Types.ObjectId
const UserModal = require('../models/users.model')
const Bid = require('../models/bids.model')

const approvedUserProfileUpdate = async (request) => {
    try {
        let payload = {
            userId: request.userId,
            isApproved: true,
        }

        const user = await UserModal.findByIdAndUpdate(
            { _id: ObjectId(payload.userId) },
            { $set: payload },
            { new: true }
        )
        return user
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

const updateUserProfile = async (request) => {
    try {
        let user = await UserModal.findByIdAndUpdate(
            { _id: ObjectId(request.userId) },
            { $set: request },
            { new: true }
        )
        let userbids = await Bid.find({ bidBy: user._id })
        for (let bid of userbids) {
            const UpdateBidProfile = {
                bidByProfile: user.profileImage,
            }
            await Bid.updateMany(
                { bidBy: bid.bidBy },
                { $set: UpdateBidProfile }
            )
        }

        return user
    } catch (error) {
        console.log('error', error)
        // return error
    }
}

module.exports = {
    approvedUserProfileUpdate,
    updateUserProfile,
}
