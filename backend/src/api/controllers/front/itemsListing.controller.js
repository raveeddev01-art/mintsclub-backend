const NFT = require("../../models/nfts.model");
const ObjectId = require("mongoose").Types.ObjectId;
const Categories = require("../../models/categories.model");
const { globalImgPlaceholder } = require("../../../config/vars");
const NftTokens = require("../../models/nftTokens.model");
const moment = require("moment");

exports.get = async (req, res, next) => {
  let { collectionId } = req.query;
  try {
    let filter = {
      sellingMethod: 1, // timed auctions only
      collectionId: ObjectId(collectionId),
    };
    const itemsListing = await NFT.aggregate([
      {
        $match: filter,
      },
    ]);

    res.status(200).send({
      success: true,
      data: itemsListing,
      message: "Items Listing Retrieved Successfully",
    });
  } catch (err) {
    next(err);
  }
};
