const mongoose = require("mongoose");

/**
 * Follower Schema
 * @private
 */
const ItemActivity = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nftId:{type:String},
    fromAddress:{type:String},
    toAddress:{type:String},
    price:{type:Number},
    activityType:{type:String}
  },
  { timestamps: true }
);

/**
 * @typedef Follower
 */

module.exports = mongoose.model("ItemActivity", ItemActivity);
