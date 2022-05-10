const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const UserModal = require("../../models/users.model");
const { addImage, addContent } = require("../../utils/uploadImage");
const validation = require("../../middlewares/front/validation");
const Web3 = require("web3"); // https://www.npmjs.com/package/web3
const path = require("path");
const validUrl = require("valid-url");

exports.create = async (req, res, next) => {
  try {
    let user = await UserModal.create(req.body);
    return res.send({ status: true, data: user });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  console.log(req.body, "req.body");
  // if (req.body.isApproved) {

  //   let payload = { userId: req.body.userId};
  //   console.log(payload,"payload============>")
  //   procecss.exit()
  //   if (req.body.isApproved === 'false') {
  //     payload.isApproved = false;
  //   } else {
  //     payload.isApproved = true;
  //   }

  //   try {
  //     let user = await UserModal.findByIdAndUpdate(
  //       { _id: ObjectId(payload.userId) },
  //       { $set: payload },
  //       { new: true }
  //     );
  //     return res.send({
  //       status: true,
  //       user,
  //       message: 'User profile updated successfully.',
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // }

  try {
    payload = {
      email: req.body.email,
      username: req.body.username,
      userId:req.body.userId,
      bio:req.body.bio
    };

    const { error } = validation.validateUserProfile(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, message: errorMsg });
    }
    console.log(payload,"payload=>")

    if (req.body.twitterLink && !validUrl.isUri(req.body.twitterLink)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid twitter Link" });
    } else {
      payload.twitterLink = req.body.twitterLink;
    }
    if (req.body.instaLink && !validUrl.isUri(req.body.instaLink)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid instagram Link" });
    } else {
      payload.instaLink = req.body.instaLink;
    }

    if (req.body.webLink && !validUrl.isUri(req.body.webLink)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter a valid website Link" });
    } else {
      payload.webLink = req.body.webLink;
    }

    let imagesPayload = {
      profileImage: req.body.profileImage,
      bannerImage: req.body.bannerImage,
    };

    const newPayload = { ...payload, ...imagesPayload };

    if (req.file) {
      const imgData = fs.readFileSync(req.file.path);
      newPayload.profileImage = await addImage(imgData);
    }

    if (req.files) {
      for (const key in req.files) {
        const image = req.files[key][0];
        const imgData = fs.readFileSync(image.path);
        newPayload[key] = await addImage(imgData);
      }
    }
console.log(newPayload,"newPayload=======================>")
    let user = await UserModal.findByIdAndUpdate(
      { _id: ObjectId(newPayload.userId) },
      { $set: newPayload },
      { new: true }
    );
    return res.send({
      status: true,
      user,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
exports.getCreators = async (req, res, next) => {
  try {
    let users = await UserModal.aggregate([
      {
        $match: {},
      },
      {
        $project: {
          profileImage: 1,
          username: 1,
          address: 1,
        },
      },
    ]);

    return res.send({
      status: true,
      data: users,
      message: "Authors fetched succeSsfully",
    });
  } catch (error) {
    return next(error);
  }
};

exports.topSellers = async (req, res, next) => {
  try {
    let { page, limit } = req.query;

    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== "" ? parseInt(limit) : 10;

    const total = await UserModal.countDocuments({});

    if (page > Math.ceil(total / limit) && total > 0)
      page = Math.ceil(total / limit);

    const pipeline = [
      {
        $match: { totalETH: { $ne: 0 } },
      },
      {
        $sort: { totalETH: -1 },
      },
    ];
    const newTotal = await UserModal.aggregate(pipeline);

    const totalRecords = newTotal.length;

    pipeline.push({ $skip: limit * (page - 1) });
    pipeline.push({ $limit: limit });

    let users = await UserModal.aggregate(pipeline);

    return res.send({
      success: true,
      message: "Top Sellers fetched successfully",
      data: {
        topSellers: users,
        pagination: {
          page,
          limit,
          totalRecords,
          pages:
            Math.ceil(totalRecords / limit) <= 0
              ? 1
              : Math.ceil(totalRecords / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
exports.getUser = async (req, res, next) => {
  try {
    let { userId } = req.params;

    let payload = { userId };

    const { error } = validation.validateUser(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    let user = await UserModal.findOne({ _id: ObjectId(payload.userId) });

    if (user) {
      return res.send({
        success: true,
        data: user,
        message: "user fetched successfully",
      });
    }
    return res.send({
      success: false,
      message: "User does not exist",
    });
  } catch (error) {
    return next(error);
  }
};
