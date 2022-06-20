const fs = require("fs");
const moment = require("moment");
const Users = require("../../models/users.model");
const Bid = require("../../models/bids.model");
const Collection = require("../../models/collection.model");
const NFT = require("../../models/nfts.model");
const NftTokens = require("../../models/nftTokens.model");
const { addImage, addContent } = require("../../utils/upload");
const ObjectId = require("mongoose").Types.ObjectId;
const validation = require("../../middlewares/front/nftValidation");
const Likes = require("../../models/likes.model");
const ActivityModal = require("../../models/item-activity.modal");
const {
  userDefaultImage,
  collectionDefaultImage,
} = require("../../../config/vars");

// API to create NFT
exports.create = async (req, res, next) => {
  console.log(req.body, "req.body}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}");
  try {
    let payload = {
      name: req.body.name,
      description: req.body.description,
      properties: JSON.parse(req.body.properties),
      levels: JSON.parse(req.body.levels),
      stats: JSON.parse(req.body.stats),
      fileType: req.body.fileType,
      ownerId: req.body.ownerId,
      userId: req.body.userId,
      collectionId: req.body.collectionId,
      categoryId: req.body.categoryId,
      currentPrice: 0,
      ownerAddress: req.body.ownerAddress,
      copies: req.body.copies,
    };
    console.log(payload, "payload");
    const { error } = validation.validateNFTSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, message: errorMsg });
    }

    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    if (!payload.image) {
      return res.send({
        status: false,
        message: "image field of type(image/video/audio) is required",
      });
    }

    let payloadProperties = {
      properties: payload.properties,
      levels: payload.levels,
      stats: payload.stats,
    };

    payload.metaData = await addContent({
      name: payload.name,
      description: payload.description,
      image: payload.image,
      properties: payloadProperties,
      nftOwnerId: payload.ownerId,
      ownerAddress: payload.ownerAddress,
    });

    payload.creatorId = payload.userId;
    payload.remainingCopies = payload.copies;

    return res.send({
      success: true,
      message: "Uploaded data on IPFS successfully",
      nft: payload,
    });
  } catch (error) {
    console.log(error, "error=======>");
    return next(error);
  }
};

exports.storeDataInDb = async (req, res, next) => {
  try {
    //create nft
    if (!req.body.data) {
      return res.send({
        status: false,
        message: "please provide data",
      });
    }
    console.log(req.body, "req.body while storing data");

    let createNFTPayload = req.body.data;
    createNFTPayload.image = req.body.image;
    createNFTPayload.highestBid = 0;
    createNFTPayload.currentPrice = 0;
    createNFTPayload.auctionEnded = false;
    createNFTPayload.tokenId = Number(req.body.nftToken);
    console.log(createNFTPayload, "createNFTPayload");

    const nft = await NFT.create(createNFTPayload);

    if (nft) {
      let collectionRecord = await Collection.findOne({
        _id: req.body.data.collectionId,
      });

      collectionRecord.nft.push(nft._id);
      collectionRecord.save();
    }

    let nftTokenPayload = {
      nftToken: req.body.nftToken,
      nftId: nft._id,
      tokenStandard: req.body.tokenStandard,
    };

    if (!nftTokenPayload.tokenStandard) {
      nftTokenPayload.tokenStandard = "ERC-1155";
    }

    const nftToken = await NftTokens.create(nftTokenPayload);

    //add activity
    let activityPayload = {
      ownerId: nft.ownerId,
      toAddress: nft.ownerAddress,
      nftId: nft._id,
      activityType: "Mint",
    };

    await ActivityModal.create(activityPayload);
    if (nftToken) {
      return res.send({
        success: true,
        message: "Item created successfully",
        nft,
      });
    }
  } catch (error) {
    return next(error);
  }
};

// API to edit NFT
exports.edit = async (req, res, next) => {
  try {
    let payload = req.body;
    if (!payload.sellingMethod) {
      return res.status(400).send({
        success: false,
        message: "sellingMethod is required",
      });
    }
    payload.sellingConfig = JSON.parse(payload.sellingConfig);
    let getNFT = await NFT.findOne({
      _id: payload._id,
    });

    if (getNFT.remainingCopies < payload.copiesForAuction) {
      return res.send({
        success: false,
        message: '"copies for auction" must be equal or less than "copies"',
      });
    }
    if (Number(payload.sellingMethod) === 1) {
      const { error } = validation.validateNFFixedTAuctionSchema(payload);

      if (error) {
        let errorMsg = error.details[0].message;
        return res.status(400).send({ status: false, message: errorMsg });
      }
      payload.currentPrice = Number(payload.sellingConfig.price.amount);
      payload.highestBid = Number(payload.sellingConfig.price.amount);
    } else {
      const { error } = validation.validateNFTimedTAuctionSchema(payload);

      if (error) {
        let errorMsg = error.details[0].message;
        return res.status(400).send({ status: false, data: errorMsg });
      }
      payload.currentPrice = Number(payload.sellingConfig.startPrice.amount);
      let startDate = moment(new Date(payload.sellingConfig.duration.startDate))
        .utc(false)
        .toISOString();

      let endDate = moment(new Date(payload.sellingConfig.duration.endDate))
        .utc(false)
        .toISOString();

      payload.sellingConfig.duration.startDate = startDate;
      payload.sellingConfig.duration.endDate = endDate;
      payload.auctionStartDate = startDate;
      payload.auctionEndDate = endDate;
      payload.highestBid = Number(payload.sellingConfig.startPrice.amount);
    }

    const nft = await NFT.findByIdAndUpdate(
      { _id: payload._id },
      { $set: payload }
      // { new: true }
    );
    return res.send({
      success: true,
      message: "Successfully put on sell",
      nft,
    });
  } catch (error) {
    console.log(error, "error");
    return next(error);
  }
};

// API to get a NFT
exports.get = async (req, res, next) => {
  try {
    const { nftId } = req.params;
    let payload = {
      nftId: nftId,
    };
    const { error } = validation.validateNftId(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, message: errorMsg });
    }

    let pipeline = [
      {
        $match: { _id: ObjectId(payload.nftId) },
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
        },
      },
      {
        $lookup: {
          from: "collections",
          foreignField: "_id",
          localField: "collectionId",
          as: "collection",
        },
      },
      {
        $unwind: {
          path: "$collection",
        },
      },
    ];
    let nftDetail = await NFT.aggregate(pipeline);

    nftDetail = nftDetail[0];
    if (!nftDetail) {
      return res.send({
        success: false,
        message: "No data found for this nft id",
      });
    }

    const tokenData = await NftTokens.findOne({ nftId: payload.nftId });

    const nftLikes = await Likes.findOne({ nftId: payload.nftId });

    let returnData = JSON.parse(JSON.stringify(nftDetail));

    const lowestInCollection = await NFT.find({
      collectionId: nftDetail.collectionId,
    })
      .sort({ currentPrice: 1 })
      .limit(1);

    if (lowestInCollection) {
      returnData.lowestNftPrice = lowestInCollection[0]["currentPrice"];
    }

    if (tokenData) {
      returnData.nftToken = tokenData["nftToken"];
    }

    returnData.likesCount = 0;
    if (nftLikes) {
      returnData.likesCount = nftLikes["count"];
    }

    return res.send({
      success: true,
      message: "Item retrieved successfully",
      data: returnData,
    });
  } catch (error) {
    return next(error);
  }
};

// API to get NFTs list
exports.list = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      collectionId,
      gtePrice,
      ltePrice,
      categoryId,
      oldest,
      lowToHigh,
      newest,
      highToLow,
      ownerId,
      buy,
      auction,
      latest,
      keyword,
    } = req.query;

    let ownerId1 = ObjectId(ownerId);
    let search;
    if (keyword) {
      search = true;
    }

    let filter = {
      status: { $ne: 0 },
      ...(latest && {
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      ...(ownerId && { ownerId: ownerId1 }),
      ...(gtePrice && {
        currentPrice: { $gte: Number(gtePrice), $lte: Number(ltePrice) },
      }),
      ...(collectionId && { collectionId }),
      ...(categoryId && { categoryId }),
      ...(buy && { sellingMethod: { $eq: 1 } }),
      ...(auction && { sellingMethod: { $eq: 2 } }),
      ...(search && {
        $or: [
          { name: { $regex: ".*" + keyword + ".*", $options: "i" } },
          { description: { $regex: ".*" + keyword + ".*", $options: "i" } },
          { ownerAddress: { $regex: keyword, $options: "i" } },
        ],
      }),
    };
    // get NFTs for given collection
    if (collectionId) filter.collectionId = ObjectId(collectionId);

    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== "" ? parseInt(limit) : 10;

    const total = await NFT.countDocuments(filter);

    const nfts = await NFT.aggregate([
      { $match: filter },
      {
        $sort: {
          ...(newest && { createdAt: -1 }),
          ...(oldest && { createdAt: 1 }),
          ...(lowToHigh && { currentPrice: 1 }),
          ...(highToLow && { currentPrice: -1 }),
          name: 1,
        },
      },
      { $skip: limit * (page - 1) },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "ownerId",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          description: 1,
          fileType: 1,
          copies: 1,
          currentPrice: 1,
          collectionId: 1,
          ownerId: 1,
          creatorId: 1,
          highestBid: 1,
          userId: 1,
          auctionEndDate: 1,
          copiesForAuction: 1,
          remainingCopies: 1,
          sellingMethod: 1,
          owner: {
            _id: "$owner._id",
            username: "$owner.username",
            profilePhoto: {
              $ifNull: ["$owner.profileImage", userDefaultImage],
            },
          },
        },
      },
    ]);
    for (const nft of nfts) {
      const findCount = await Likes.findOne().where("nftId", nft._id);
      nft.likeCount = 0;
      if (findCount) {
        nft.likeCount = findCount.count;
      }
    }

    return res.send({
      success: true,
      message: "NFTs fetched successfully",
      data: {
        nfts: nfts,
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

exports.editNft = async (req, res, next) => {
  try {
    const filter = { _id: req.body.nftOwnerId };
    let update = {
      nftOwnerId: req.body.currentUserId,
    };
    const updatedNft = await NFT.findOneAndUpdate(filter, update, {
      new: true,
    });
    res.status(200).send({
      status: "success",
      data: updatedNft,
    });
  } catch (err) {
    return next(err);
  }
};

exports.updateNft = async (req, res, next) => {
  try {
    let payload = {
      nftId: req.body.nftId,
      name: req.body.name,
      description: req.body.description,
      // attributes: JSON.parse(req.body.attributes),
      // levels: JSON.parse(req.body.levels),
      // stats: JSON.parse(req.body.stats),
      fileType: req.body.fileType,
      userId: req.body.userId,
      ownerAddress: req.body.ownerAddress,
      collectionId: req.body.collectionId,
      currentPrice: req.body.currentPrice,
      copies: req.body.copies,
    };
    const { error } = validation.validateEditNftSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, message: errorMsg });
    }
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    if (!payload.image) {
      return res.send({
        status: false,
        message: "image field is required",
      });
    }
    const ownerId = payload.userId;

    // let payloadProperties = {
    //   attributes: payload.attributes,
    //   levels: payload.levels,
    //   stats: payload.stats,
    // };

    payload.metaData = await addContent({
      name: payload.name,
      description: payload.description,
      image: payload.image,
      // properties: payloadProperties,
      nftOwnerId: ownerId,
      ownerAddress: payload.ownerAddress,
    });

    const updateNft = await NFT.findByIdAndUpdate(
      { _id: payload.nftId },
      { $set: payload },
      { new: true }
    );

    res.status(200).send({
      status: true,
      data: updateNft,
    });
  } catch (err) {
    return next(error);
  }
};

exports.getNFTsbyCollection = async (req, res, next) => {
  try {
    const collectionId = req.body.collectionId;

    const NFTs = await NFT.aggregate([
      {
        $match: { collectionId: ObjectId(collectionId) },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "ownerId",
          as: "owner",
        },
      },
    ]);
    for (const nft of NFTs) {
      const findCount = await Likes.findOne().where("nftId", nft._id);
      nft.likeCount = 0;
      if (findCount) {
        nft.likeCount = findCount.count;
      }
    }

    // const nftLikes = await Likes.findOne({ collectionId: req.body.collectionId });
    // NFTs.likesCount=nftLikes['count']
    res.status(200).send({ success: true, data: NFTs });
  } catch (err) {
    res.status(200).send({ success: false, error: err });
  }
};

// API to delete nft
exports.delete = async (req, res, next) => {
  try {
    const { nftId } = req.params;
    if (nftId) {
      const nftDetail = await NFT.find({ _id: nftId });

      const nft = await NFT.deleteOne({ _id: nftId });
      if (nft.deletedCount) {
        const nftToken = await NftTokens.deleteOne({ nftId: nftId });

        const updateCollection = await Collection.updateOne(
          { _id: nftDetail[0]["collectionId"] },
          { $pull: { nft: nftId } }
        );

        if (nftToken && updateCollection) {
          return res.send({
            status: true,
            message: "NFT deleted successfully",
          });
        }
      }
      return res.status(400).send({
        status: false,
        message: "NFT not found for given Id",
      });
    } else
      return res
        .status(400)
        .send({ status: false, message: "NFT Id is required" });
  } catch (error) {
    return next(error);
  }
};

// API to get user NFTs listing
exports.myNftListing = async (req, res, next) => {
  try {
    let { userId, page, limit } = req.query;

    page = page !== undefined && page !== "" ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== "" ? parseInt(limit) : 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    if (!userId)
      return res
        .status(400)
        .send({ status: false, message: "Please Sign In First" });

    const myNfts = await NFT.find({})
      .where("userId", userId)
      .populate("collectionId", "name");

    if (myNfts.length == 0) {
      return res.status(400).send({
        status: false,
        message: "No NFT Found",
      });
    }

    let data = {};

    data.totalRecords = myNfts.length;

    if (endIndex < myNfts.length) {
      data.next = {
        page: page + 1,
        limit: limit,
      };
    }
    if (startIndex > 0) {
      data.previous = {
        page: page - 1,
        limit: limit,
      };
    }
    data.NFTs = myNfts.slice(startIndex, endIndex);

    return res.status(200).send({
      status: true,
      message: "My NFTs fetched successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
exports.buyNow = async (req, res, next) => {
  try {
    let payload = req.body;

    const { error } = validation.validateBuyNowSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, message: errorMsg });
    }

    const buyNftDetail = await NFT.findOne({
      _id: payload.nftId,
    });

    if (buyNftDetail && buyNftDetail.copiesForAuction > 0) {
      if (buyNftDetail.remainingCopies > buyNftDetail.copiesForAuction) {
        let newPayload = {
          ownerId: payload.userId,
          userId: payload.userId,
          ownerAddress: payload.ownerAddress,
          copies: buyNftDetail.copiesForAuction,
          name: buyNftDetail.name,
          description: buyNftDetail.description,
          fileType: buyNftDetail.fileType,
          creatorId: buyNftDetail.creatorId,
          collectionId: buyNftDetail.collectionId,
          categoryId: buyNftDetail.categoryId,
          currentPrice: buyNftDetail.currentPrice,
          metaData: buyNftDetail.metaData,
          image: buyNftDetail.image,
          remainingCopies: buyNftDetail.copiesForAuction,
        };

        const nft = await NFT.create(newPayload);
        if (nft) {
          let collectionRecord = await Collection.findOne({
            _id: buyNftDetail.collectionId,
          });

          collectionRecord.nft.push(nft._id);
          collectionRecord.save();
        }

        const nftTokenDetail = await NftTokens.findOne({
          nftId: payload.nftId,
        });

        let nftTokenPayload = {
          nftToken: nftTokenDetail.nftToken,
          nftId: nft._id,
          tokenStandard: nftTokenDetail.tokenStandard,
        };

        await NftTokens.create(nftTokenPayload);

        const remainingCopies =
          buyNftDetail.copies - buyNftDetail.copiesForAuction;

        let newPayloadCopies = {
          copiesForAuction: 0,
          remainingCopies: remainingCopies,
          sellingMethod: 0,
          sellingConfig: {
            price: {
              currency: null,
              amount: 0,
            },
            reserveFor: 0,
          },
        };

        const nftUpdate = await NFT.findByIdAndUpdate(
          { _id: buyNftDetail._id },
          { $set: newPayloadCopies }
          // { new: true }
        );
        if (nftUpdate) {
          let findUserDetail = await Users.findOne({
            _id: nftUpdate.ownerId,
          });

          let newTotalETH = findUserDetail.totalETH + buyNftDetail.currentPrice;

          await Users.findByIdAndUpdate(
            { _id: nftUpdate.ownerId },
            { $set: { totalETH: newTotalETH } }
          );

          return res.status(200).send({
            success: true,
            message: "Ownership transferred successfully",
          });
        }
      } else {
        let newPayload = {
          ownerId: payload.userId,
          ownerAddress: payload.ownerAddress,
          userId: payload.userId,
          copies: buyNftDetail.copiesForAuction,
          remainingCopies: buyNftDetail.copiesForAuction,
          copiesForAuction: 0,
          sellingMethod: 0,
          sellingConfig: {
            listingSchedule: {
              startTime: null,
              endTime: null,
            },
            price: {
              currency: null,
              amount: 0,
            },
          },
        };

        const nftUpdate = await NFT.findByIdAndUpdate(
          { _id: buyNftDetail._id },
          { $set: newPayload }
          // { new: true }
        );
        if (nftUpdate) {
          let findUserDetail = await Users.findOne({
            _id: nftUpdate.ownerId,
          });

          let newTotalETH = findUserDetail.totalETH + buyNftDetail.currentPrice;

          await Users.findByIdAndUpdate(
            { _id: nftUpdate.ownerId },
            { $set: { totalETH: newTotalETH } }
          );

          return res.status(200).send({
            success: true,
            message: "Owner ship transferred successfully",
          });
        }
      }
    } else {
      return res.send({
        success: false,
        message: "NFT is not for sale of this ID",
      });
    }
  } catch (error) {
    return next(error);
  }
};
exports.endAuction = async (req, res, next) => {
  try {
    const auctionEndNft = req.body.nft;

    const bid = await Bid.find({
      nftId: auctionEndNft._id,
      bidAmount: auctionEndNft.highestBid,
    });

    if (bid.length > 0) {
      let bidData = bid[0];
      if (auctionEndNft.remainingCopies > auctionEndNft.copiesForAuction) {
        let payload = {
          ownerId: bidData.bidBy,
          userId: bidData.bidBy,
          ownerAddress: bidData.fromAddress,
          copies: auctionEndNft.copiesForAuction,
          name: auctionEndNft.name,
          description: auctionEndNft.description,
          fileType: auctionEndNft.fileType,
          creatorId: auctionEndNft.creatorId,
          collectionId: auctionEndNft.collectionId,
          categoryId: auctionEndNft.categoryId,
          currentPrice: bidData.bidAmount,
          auctionEnded: false,
          metaData: auctionEndNft.metaData,
          image: auctionEndNft.image,
          highestBid: 0,
          remainingCopies: auctionEndNft.copiesForAuction,
          tokenId: auctionEndNft.tokenId,
        };

        const NFTCreated = await NFT.create(payload);

        let collectionRecord = await Collection.findOne({
          _id: auctionEndNft.collectionId,
        });

        collectionRecord.nft.push(NFTCreated._id);
        collectionRecord.save();

        let nftTokenDetail = await NftTokens.findOne({
          nftId: auctionEndNft._id,
        });

        let nftTokenPayload = {
          nftToken: nftTokenDetail.nftToken,
          nftId: NFTCreated._id,
          tokenStandard: nftTokenDetail.tokenStandard,
        };

        await NftTokens.create(nftTokenPayload);

        const remainingCopies =
          auctionEndNft.copies - auctionEndNft.copiesForAuction;

        let newPayload = {
          copiesForAuction: 0,
          remainingCopies: remainingCopies,
          auctionEndDate: null,
          auctionStartDate: null,
          auctionEnded: false,
          sellingMethod: 0,
          sellingConfig: {
            startPrice: {
              currency: null,
              amount: 0,
            },
            duration: {
              startTime: null,
              endTime: null,
            },
          },
        };

        let nftUpdate = await NFT.findByIdAndUpdate(
          { _id: auctionEndNft._id },
          { $set: newPayload }
          // { new: true }
        );
        if (nftUpdate) {
          let findUserDetail = await Users.findOne({
            _id: nftUpdate.ownerId,
          });

          let newTotalETH = findUserDetail.totalETH + bidData.bidAmount;

          await Users.findByIdAndUpdate(
            { _id: nftUpdate.ownerId },
            { $set: { totalETH: newTotalETH } }
          );
        }

        await Bid.findByIdAndUpdate(
          { _id: bidData._id },
          { $set: { isAccepted: true } }
          // { new: true }
        );

        let activityPayload = {
          nftId: auctionEndNft._id,
          ownerId: auctionEndNft.ownerId,
          fromAddress: auctionEndNft.ownerAddress,
          activityType: "Transfer",
          toAddress: bidData.fromAddress,
          price: bidData.bidAmount,
        };

        await ActivityModal.create(activityPayload);
      } else {
        let payload = {
          ownerId: bidData.bidBy,
          userId: bidData.bidBy,
          ownerAddress: bidData.fromAddress,
          auctionEndDate: null,
          auctionStartDate: null,
          sellingMethod: 0,
          copies: auctionEndNft.copiesForAuction,
          remainingCopies: auctionEndNft.copiesForAuction,
          copiesForAuction: 0,
          currentPrice: auctionEndNft.highestBid,
          auctionEnded: false,
          tokenId: auctionEndNft.tokenId,
          highestBid: 0,
          sellingConfig: {
            startPrice: {
              currency: null,
              amount: 0,
            },
            duration: {
              startTime: null,
              endTime: null,
            },
          },
        };

        let nftUpdate = await NFT.findByIdAndUpdate(
          { _id: auctionEndNft._id },
          { $set: payload }
          // { new: true }
        );
        if (nftUpdate) {
          let findUserDetail = await Users.findOne({
            _id: nftUpdate.ownerId,
          });

          let newTotalETH = findUserDetail.totalETH + bidData.bidAmount;

          await Users.findByIdAndUpdate(
            { _id: nftUpdate.ownerId },
            { $set: { totalETH: newTotalETH } }
          );

          let activityPayload = {
            nftId: auctionEndNft._id,
            ownerId: auctionEndNft.ownerId,
            fromAddress: auctionEndNft.ownerAddress,
            activityType: "Transfer",
            toAddress: bidData.fromAddress,
            price: bidData.bidAmount,
          };

          await ActivityModal.create(activityPayload);
        }
      }
    }
    let payload = {
      auctionEndDate: null,
      auctionStartDate: null,
      sellingMethod: 0,
      copiesForAuction: 0,
      auctionEnded: false,
      sellingConfig: {
        startPrice: {
          currency: null,
          amount: 0,
        },
        duration: {
          startTime: null,
          endTime: null,
        },
      },
    };

    await NFT.findByIdAndUpdate(
      { _id: auctionEndNft._id },
      { $set: payload }
      // { new: true }
    );
    let tst = [auctionEndNft._id];
    await Bid.deleteMany({ nftId: auctionEndNft._id });
    res
      .status(200)
      .send({ success: true, message: "Auction Ended successfully" });
    // }
  } catch (err) {
    console.log(err, "error while end auction");
    return next(err);
  }
};
