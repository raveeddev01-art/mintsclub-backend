// const fs = require('fs')
const Notification = require('../../models/notification.model')
const Collection = require('../../models/collection.model')


const addNotification = async (payload) => {
  const notification = new Notification(payload);
  return notification.save();
};

const addManyNotification = async (payload) => {
  const notification = await Notification.insertMany(payload);
  return notification;
};

const getUserUnSeenNotifications = async (userId) => {
  return await Notification.find({ userId, isSeen: false });
};

// const createNotifications = async (req, res, next) => {
//   try {
//       const payload = req.body

//       const notification = await Notification.create(payload)

//       return res.status(HTTP_STATUS_CODE.OK).send({
//           success: SUCCESS_STATUS.TRUE,
//           message: SUCCESS_MESSAGE.OFFER_MADE_SUCCESSFULLY,
//           notification,
//       })
//   } catch (error) {
//       return next(error)
//   }
// }


const updateNotifications = async (notificationId, data) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId },
    { ...data }
  );
};

const getUserSeenNotifications = async (userId) => {
  return await Notification.find({ userId, isSeen: true }).sort({
    createdAt: -1,
  });
};

const getUserNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({
    createdAt: -1,
  });
};

const {
    ERROR_MESSAGE,
    SUCCESS_MESSAGE,
    SUCCESS_STATUS,
    HTTP_STATUS_CODE,
} = require('../../../config/constants')

const getUserUnSeenNotification = async (req, res) => {
  try {
    const { user } = req;

    const userNotification =
      await getUserUnSeenNotifications(user.id);

    return res.status(HTTP_STATUS_CODE.OK).json(userNotification);
  } catch (err) {
    console.log("notificaton error ===", err);
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(err);
  }
};

const createNotification = async (request, response) => {
  try {
    const { body } = request;
    const data = await addNotification(
      body
    );
    return response.status(HTTP_STATUS_CODE.OK).json(data);
  } catch (error) {
    console.log("createNotification error ====", error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};
const createManyNotification = async (request, response) => {
  try {
    const { body } = request;
    const data = await addManyNotification(
      body
    );
    return response.status(HTTP_STATUS_CODE.OK).json(data);
  } catch (error) {
    console.log("createManyNotification error ====", error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};

const updateNotification = async (request, response) => {
  try {
    const { body } = request;
    const { notificationId } = request.params;
    const data = await updateNotifications(
      notificationId,
      body
    );
    return response.status(HTTP_STATUS_CODE.OK).json(data);
  } catch (error) {
    console.log("updateNotification error ====", error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};

const getUserSeenNotification = async (request, response) => {
  try {
    const { user } = request;

    const userNotification =
      await getUserSeenNotifications(user.id);

    return response.status(HTTP_STATUS_CODE.OK).json(userNotification);
  } catch (error) {
    console.log("Get User Seen Notification ====", error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};

const getAllNotifications = async (request, response) => {
  try {
    const { user } = request;
    const userNotification = await getUserNotifications(
      user.id
    );

    return response.status(HTTP_STATUS_CODE.OK).json(userNotification);
  } catch (error) {
    console.log("get all Notification error ====", error);
    return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error);
  }
};

module.exports = {
  createManyNotification,
  getUserUnSeenNotification,
  updateNotification,
  createNotification,
  getUserSeenNotification,
  getAllNotifications,
};
