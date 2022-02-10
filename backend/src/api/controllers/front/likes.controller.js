const LikesModal = require('../../models/likes.model');
var ObjectId = require('mongodb').ObjectId;

exports.likeDislike = async (req, res, next) => {
  let collectionId = req.body.collectionId;
  let userId = req.body.userId;
  let count = req.body.count;

  let foundCollection = await LikesModal.find({ collectionId });

  if (foundCollection[0]) {
    //find if user already exist
    await LikesModal.findOne(
      { likes: { $elemMatch: { userId: req.body.userId } } },
      async function (err, user) {
        //error

        if (err) {
          console.log('error', err);
        }

        //if user exist then delete that record

        if (user) {
          console.log('found user');
          await LikesModal.updateOne(
            { collectionId: new ObjectId(collectionId) },
            { $inc: { count: -1 } }
          ).exec();

          let result = await LikesModal.updateOne(
            { collectionId: new ObjectId(collectionId) },
            { $pull: { likes: { userId: new ObjectId(userId) } } },
            { multi: true }
          );
          res.status(200).send(result);
        }
        //if user not found then insert a user like
        else {
          console.log('user not found inserting one');

          let data = {
            userId,
          };
          try {
            await LikesModal.updateOne(
              { collectionId: new ObjectId(collectionId) },
              { $inc: { count: 1 } },

              { new: true, upsert: true }
            ).exec();

            let insertedLike = await LikesModal.updateOne(
              { collectionId: new ObjectId(collectionId) },
              { $push: { likes: data } },
              { new: true, upsert: true }
            ).exec();
            res.status(200).send({
              success: true,
              message: 'record updated successfully',
              result: insertedLike,
            });
          } catch (err) {
            res.status(200).send(err);
          }
        }
      }
    );
  }
  //if collecton not found
  else {
    console.log('colleciton not found inserting one');
    let data = {
      collectionId,
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
