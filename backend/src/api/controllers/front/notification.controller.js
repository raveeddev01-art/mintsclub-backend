// const fs = require('fs')
const Notification = require('../../models/notification.model')
const Collection = require('../../models/collection.model')

const addNotification = async (payload) => {
    const notification = new Notification(payload)
    return notification.save()
}

const addManyNotification = async (payload) => {
    const notification = await Notification.insertMany(payload)
    return notification
}

const getUserUnSeenNotifications = async (userId) => {
    return await Notification.find({ userId, isSeen: false })
}


const updateNotifications = async (notificationId, data) => {
    return Notification.findOneAndUpdate({ _id: notificationId }, { ...data })
}

const getUserSeenNotifications = async (userId) => {
    return await Notification.find({ userId, isSeen: true }).sort({
        createdAt: -1,
    })
}

const getUserNotifications = async (userId) => {

    return await Notification.find({ userId }).sort({
        createdAt: -1,
    })
}

const { HTTP_STATUS_CODE } = require('../../../config/constants')

const getUserUnSeenNotification = async (req, res) => {
    try {
        const { user } = req

        const userNotification = await getUserUnSeenNotifications(user.id)

        return res.status(HTTP_STATUS_CODE.OK).json(userNotification)
    } catch (err) {
        console.log('notificaton error ===', err)
        return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(err)
    }
}

const createNotification = async (request, response) => {
    try {
        const { body } = request
        const data = await addNotification(body)
        return response.status(HTTP_STATUS_CODE.OK).json(data)
    } catch (error) {
        console.log('createNotification error ====', error)
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}
const createManyNotification = async (request, response) => {
    try {
        const { body } = request
        const data = await addManyNotification(body)
        return response.status(HTTP_STATUS_CODE.OK).json(data)
    } catch (error) {
        console.log('createManyNotification error ====', error)
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

const updateNotification = async (request, response) => {
    try {        
        const notificationId = request.body._id
        const params = { isSeen: request.body.isSeen }

        const data = await updateNotifications(notificationId, params)

        return response.status(HTTP_STATUS_CODE.OK).json(data)
    } catch (error) {
        console.log('updateNotification error ====', error)
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

const getUserSeenNotification = async (request, response) => {
    try {
        const { user } = request

        const userNotification = await getUserSeenNotifications(user.id)

        return response.status(HTTP_STATUS_CODE.OK).json(userNotification)
    } catch (error) {
        console.log('Get User Seen Notification ====', error)
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

const getAllNotifications = async (request, response) => {
    try {
        const { user } = request
        const userNotification = await getUserNotifications(user.id)

        const Notifications = await Notification.aggregate([
            {
                $sort: {
                    _id: -1
                },
            },
            {
                $lookup: {
                    from: 'nfts',
                    localField: 'nftId',
                    foreignField: '_id',
                    as: 'nftId'
                  }
            },
            {
                $unwind: {
                    path: '$nftId',
                    includeArrayIndex: '0',
                    preserveNullAndEmptyArrays: true
                  }

                
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'fromUserId',
                    foreignField: '_id',
                    as: 'fromUserId'
                }
            },
            {
                $unwind: {
                    path: '$fromUserId',
                    includeArrayIndex: '0',
                    preserveNullAndEmptyArrays: true
                  },   
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'toUserId',
                    foreignField: '_id',
                    as: 'toUserId'
                }
            },
            {
                $unwind: {
                    path: '$toUserId',
                    includeArrayIndex: '0',
                    preserveNullAndEmptyArrays: true
                  },   
            }
    ]);

        return response.status(HTTP_STATUS_CODE.OK).json(Notifications)
    } catch (error) {
        console.log('get all Notification error ====', error)
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

module.exports = {
    createManyNotification,
    getUserUnSeenNotification,
    updateNotification,
    createNotification,
    getUserSeenNotification,
    getAllNotifications,
}
