const Approvals = require("../../models/approvals.model");

exports.getApprovals = async (req, res, next) => {
  try {
    let filter = {};
    let pipeline = [
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "userId",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",

          username: { $first: "$user.username" },
          address: { $first: "$user.address" },
          email: { $first: "$user.email" },
          createdAt: { $first: "$user.createdAt" },
          profileImage: { $first: "$user.profileImage" },
        },
      },
    ];
    let approvals = await Approvals.aggregate(pipeline);

    res.status(200).send({
      success: true,
      data: approvals,
      message: "Approvals Retrieved Successfully!",
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateApproval = async (req, res, next) => {
  try {
    let payload = req.body;
    const Approvals = await Approvals.findByIdAndUpdate(
      { _id: payload.id },
      { $set: payload }
    );

    res.status(200).send({
      success: true,
      message: "Account Approved Successfully!",
    });
  } catch (err) {
    return next(err);
  }
};
