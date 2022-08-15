const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const Nfts = require("../../models/nfts.model");
const { userDefaultImage } = require("../../../config/vars");

// API to get nfts list
exports.list = async (req, res, next) => {
  try {
    let { page, limit, collectionId } = req.query;

    const filter = {};

    if (collectionId) filter.collectionId = ObjectId(collectionId);

    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== "" ? parseInt(limit) : 10;

    const total = await Nfts.countDocuments(filter);

    if (page > Math.ceil(total / limit) && total > 0)
      page = Math.ceil(total / limit);

    const nfts = await Nfts.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "ownerId",
          as: "owner",
        },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "creatorId",
          as: "creator",
        },
      },
      {
        $lookup: {
          from: "collections",
          foreignField: "_id",
          localField: "collectionId",
          as: "collections",
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: limit * (page - 1) },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          copies: 1,
          status: 1,
          sold: 1,
          name: 1,
          currentPrice: 1,
          image: 1,
          collection: {
            $ifNull: [{ $arrayElemAt: ["$collections", 0] }, null],
          },
        },
      },
    ]);
    const wholeData = await Nfts.find();
    return res.send({
      success: true,
      message: "Nfts fetched successfully",
      data: {
        nfts: wholeData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// API to delete nft
exports.delete = async (req, res, next) => {
  try {
    const { nftId } = req.params;
    if (nftId) {
      const nft = await Nfts.deleteOne({ _id: nftId });
      if (nft && nft.deletedCount)
        return res.send({
          success: true,
          message: "Nft deleted successfully",
          nftId,
        });
      else
        return res
          .status(400)
          .send({ success: false, message: "Nft not found for given Id" });
    } else
      return res
        .status(400)
        .send({ success: false, message: "Nft Id is required" });
  } catch (error) {
    return next(error);
  }
};
