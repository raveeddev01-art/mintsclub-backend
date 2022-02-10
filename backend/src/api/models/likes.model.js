const mongoose = require("mongoose");

/**
 * NFTOwner Schema
 * @private
 */
const LikesSchema = new mongoose.Schema(
  {
    nftId: { type: String },
    count:{type:Number},
    likes: [{userId: String }],
  },
  { timestamps: true }
);


/**
 * @typedef LikesSchema
 */

module.exports = mongoose.model("LikesSchema", LikesSchema);
