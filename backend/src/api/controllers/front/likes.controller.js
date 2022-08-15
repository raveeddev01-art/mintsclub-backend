const LikesModal = require("../../models/likes.model");
var ObjectId = require("mongodb").ObjectId;

exports.likeDislike = async (req, res, next) => {
  let nftId = req.body.nftId;
  let userId = req.body.userId;
  let count = req.body.count;

  let foundCollection = await LikesModal.find({ nftId });

  if (foundCollection[0]) {
    // find if user already exist
    await LikesModal.findOne(
      {
        likes: { $elemMatch: { userId: req.body.userId } },
        nftId: req.body.nftId,
      },
      async function (err, user) {
        //error

        if (err) {
          console.log("error", err);
        }

        //if user exist then delete that record

        if (user) {
          await LikesModal.updateOne(
            { nftId: new ObjectId(nftId) },
            { $inc: { count: -1 } }
          ).exec();

          let result = await LikesModal.updateOne(
            { nftId: new ObjectId(nftId) },
            { $pull: { likes: { userId: new ObjectId(userId) } } },
            { multi: true }
          );
          res.status(200).send(result);
        }
        //if user not found then insert a user like
        else {
          let data = {
            userId,
          };
          try {
            await LikesModal.updateOne(
              { nftId: new ObjectId(nftId) },
              { $inc: { count: 1 } },

              { new: true, upsert: true }
            ).exec();

            let insertedLike = await LikesModal.updateOne(
              { nftId: new ObjectId(nftId) },
              { $push: { likes: data } },
              { new: true, upsert: true }
            ).exec();
            res.status(200).send({
              success: true,
              message: "record updated successfully",
              result: insertedLike,
            });
          } catch (error) {
            return next(error);
          }
        }
      }
    );
  }

  //if collecton not found
  else {
    let data = {
      nftId,
      count,
      likes: [
        {
          userId,
        },
      ],
    };

    try {
      const result = await LikesModal.create(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(200).json({ success: false, error: error });
    }
  }
};

exports.get = async (req, res, next) => {
  try {
    const likes = await LikesModal.find();
    res.status(201).json({ success: true, data: likes });
  } catch (error) {
    res.status(200).json({ success: false, error: error });
  }
};

exports.userNftLikes = async (req, res, next) => {
  try {
    let { userId } = req.query;
    if (!userId)
      return res
        .status(400)
        .send({ success: false, message: "Please Sign In First" });

    const likes = await LikesModal.find({}, "nftId").where(
      "likes.userId",
      userId
    );

    return res.status(200).send({
      success: true,
      message: "User NFTs likes fetched successfully",
      data: likes,
    });
  } catch (error) {
    return next(error);
  }
};
