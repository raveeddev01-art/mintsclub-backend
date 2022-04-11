const ItemActivity = require('../../models/item-activity.modal');
const mongoose = require('mongoose');

exports.create = async (req, res, next) => {
  try {
    let payload = req.body;
    console.log(payload, 'payload');
    const result = await ItemActivity.create(payload);
    if (result) {
      res.status(200).send({
        success: true,
        message: 'Item Activity Created Successfully',
        data: result,
      });
    }
  } catch (error) {
    return next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    let activities = await ItemActivity.find({ nftId: req.query.nftId });

    res.status(200).send({
      success: true,
      message: 'Item Activity Retrieved Successfully',
      data: activities,
    });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    let payload = req.body;

    const updatedActivity = await ItemActivty.findByIdAndUpdate(
      { _id: payload.id },
      { $set: payload },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: 'NFT Deleted Successfully',
      data: updatedActivity,
    });
  } catch (error) {
    return next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    let nftId = req.body.nftId;
    nftId = mongoose.Types.ObjectId(nftId);
    let result = await ItemActivity.deleteMany({ nftId: nftId });
    if (result) {
      res.status(200).send({
        success: true,
        message: 'NFT Deleted Successfully',
      });
    }
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
