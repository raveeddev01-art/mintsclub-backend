const fs = require('fs');
const moment = require('moment');
const User = require('../../models/users.model');
const Collection = require('../../models/collection.model');
const NFT = require('../../models/nfts.model');
const NftTokens = require('../../models/nftTokens.model');
const { addImage, addContent } = require('../../utils/upload');
const ObjectId = require('mongoose').Types.ObjectId;
const validation = require('../../middlewares/front/nftValidation');
const Likes = require('../../models/likes.model');

const {
  userDefaultImage,
  collectionDefaultImage,
} = require('../../../config/vars');

// API to create NFT
exports.create = async (req, res, next) => {
  console.log(req.body, 'req.body');
  try {
    //let payload = req.body;

    let payload = {
      name: req.body.name,
      description: req.body.description,
      // attributes: req.body.attributes,
      // levels: req.body.levels,
      ownerId: req.body.ownerId,
      userId: req.body.userId,
      collectionId: req.body.collectionId,
      currentPrice: req.body.currentPrice,
      ownerAddress: req.body.ownerAddress,
      // txHash: req.body.txHash,
      royalty: req.body.royalty,
      copies: req.body.copies,
      status: req.body.status,
      // sold: req.body.sold,
      // sellingMethod: req.body.sellingMethod,
      // auctionStartDate: req.body.auctionStartDate,
      // auctionEndDate: req.body.auctionEndDate,
      // auctionStartTime: req.body.auctionStartTime,
      // auctionEndTime: req.body.auctionEndTime,
    };
    const { error } = validation.validateNFTSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    if (!payload.image) {
      return res.send({
        status: false,
        message: 'image field is required',
      });
    }

    payload.metaData = await addContent({
      name: payload.name,
      description: payload.description,
      image: payload.image,
      //   properties: {
      //     size: newPayload.size || '',
      //   },
      properties: payload.attributes,
      nftOwnerId: payload.ownerId,
      ownerAddress: payload.ownerAddress,
    });

    // payload.ownerId = req.user;
    // payload.creatorId = req.user;

    return res.send({
      success: true,
      message: 'Uploaded data on IPFS successfully',
      nft: payload,
    });
  } catch (error) {
    //console.log(error,"error while creating nft")
    return next(error);
  }
};

exports.storeDataInDb = async (req, res, next) => {
  try {
    //create nft
    if (!req.body.data) {
      return res.send({
        status: false,
        message: 'please provide data',
      });
    }
    let createNFTPayload = req.body.data;
    createNFTPayload.image = req.body.image;

    const nft = await NFT.create(createNFTPayload);
    if (nft) {
      //req.body.data.collectionId
      let collectionRecord = await Collection.findOne({
        _id: req.body.data.collectionId,
      });
      collectionRecord.nft.push(nft._id);
      collectionRecord.save();
    }
    //create nft token
    let nftTokenPayload = {
      nftToken: req.body.nftToken,
      nftId: req.body.nftId,
      tokenStandard: req.body.tokenStandard,
    };
    if (!nftTokenPayload.tokenStandard) {
      nftTokenPayload.tokenStandard = 'erc-721';
    }
    let nftToken = await NftTokens.create(nftTokenPayload);

    return res.send({
      success: true,
      message: 'Item created successfully',
      nft,
    });
  } catch (error) {
    return next(error);
  }
};

// API to edit NFT
exports.edit = async (req, res, next) => {
  try {
    let payload = req.body;
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    // set NFT selling config.
    if (payload.sellingMethod && payload.sellingConfig) {
      payload.sellingConfig = JSON.parse(payload.sellingConfig);

      // set auction start & end date-time
      const datetimeKey =
        Number(payload.sellingMethod) === 1 ? 'listingSchedule' : 'duration';
      payload.auctionStartDate = payload.sellingConfig[datetimeKey]?.startDate;
      payload.auctionEndDate = payload.sellingConfig[datetimeKey]?.endDate;
      payload.auctionStartTime = payload.sellingConfig[datetimeKey]?.startTime;
      payload.auctionEndTime = payload.sellingConfig[datetimeKey]?.endTime;
    }

    const nft = await NFT.findByIdAndUpdate(
      { _id: payload._id },
      { $set: payload },
      { new: true }
    );
    return res.send({
      success: true,
      message: 'NFT updated successfully',
      nft,
    });
  } catch (error) {
    return next(error);
  }
};

// API to edit status NFT
exports.update = async (req, res, next) => {
  try {
    let payload = req.body;

    console.log('request', req.body);

    // set NFT selling config.

    const nft = await NFT.findByIdAndUpdate(
      { _id: payload._id },
      { $set: payload },
      { new: true }
    );
    console.log('nft after update');
    return res.send({
      success: false,
      message: 'Sorry! You rejected wallet processing',
      nft,
    });
  } catch (error) {
    return next(error);
  }
};
// API to get a NFT
exports.get = async (req, res, next) => {
  try {
    const { nftId } = req.params;
    let nftDetail = new Array();
    nftDetail = await NFT.findOne({ _id: nftId });
    const tokenData = await NftTokens.findOne({ nftId: nftId });
    // console.log('token data', tokenData);
    // nftDetail['nftToken'] = tokenData.nftToken;
    // nftDetail['tokenStandard'] = tokenData.tokenStandard;
    // console.log('nftDetail', nftDetail);
    // "data": {
    //     "copies": 100,
    //     "status": 1,
    //     "sold": 0,
    //     "_id": "620231380a6afa1d184335e8",
    //     "name": "aqsanft",
    //     "description": "first",
    //     "creatorId": "61b9f57ca6af441d75672977",
    //     "ownerId": "61b9f57ca6af441d75672977",
    //     "userId": "61b9f57ca6af441d75672977",
    //     "collectionId": "61f3d1fd92569f54a783a07b",
    //     "currentPrice": 50,
    //     "ownerAddress": "0x068839af9e0A418F714AC5d52e54a4Db587605C6",
    //     "txHash": "test",
    //     "image": "myomae",
    //     "sellingMethod": 1,
    //     "metaData": "this is ipfs link",
    //     "createdAt": "2022-02-08T09:00:40.680Z",
    //     "updatedAt": "2022-02-08T09:00:40.680Z",
    //     "__v": 0
    // console.log(wholeData,"testNft===>data")
    // const nft = await NFT.aggregate([
    //     {
    //         $match: { _id: ObjectId(nftId) }
    //     },
    //     {
    //         $lookup: {
    //             from: 'users',
    //             foreignField: '_id',
    //             localField: 'creatorId',
    //             as: 'creator'
    //         }
    //     },
    //     // {
    //     //     $unwind: '$creator'
    //     // },
    //     {
    //         $lookup: {
    //             from: 'users',
    //             foreignField: '_id',
    //             localField: 'ownerId',
    //             as: 'owner'
    //         }
    //     },
    //     // {
    //     //     $unwind: '$owner'
    //     // },
    //     {
    //         $lookup: {
    //             from: 'collections',
    //             foreignField: '_id',
    //             localField: 'collectionId',
    //             as: 'collection'
    //         }
    //     },
    //     {
    //         $unwind: '$collection'
    //     },
    //     // {collection
    //     //         from: 'bids',
    //     //         foreignField: 'nftId',
    //     //         localField: '_id',
    //     //         as: 'bids'
    //     //     }
    //     // },
    //     {
    //         $project: {
    //             _id: 1, name: 1, description: 1, image: 1, createdAt: 1, sellingMethod: 1,nftOwnerId:1,
    //             size: { $ifNull: ['$size', 'N/A'] },
    //             sold: 1, copies: 1, currentPrice: 1,
    //             auctionEndDate: 1,
    //             // creator: {
    //             //     _id: '$creator._id',
    //             //     username: '$creator.username',
    //             //     profilePhoto: { $ifNull: ['$creator.profilePhoto', userDefaultImage] }
    //             // },
    //             // owner: {
    //             //     _id: '$owner._id',
    //             //     username: '$owner.username',
    //             //     profilePhoto: { $ifNull: ['$owner.profilePhoto', userDefaultImage] }
    //             // },
    //             collection: {
    //                 _id: '$collection._id',
    //                 name: '$collection.name',
    //                 image: { $ifNull: ['$collection.featuredImg', collectionDefaultImage] },
    //                 userId: '$collection.userId'
    //             },
    //             // highestBidAmt: { $max: '$bids.price.amount' }
    //         },
    //     }
    // ])

    if (!nftDetail && !tokenData) {
      return res.send({
        success: false,
        message: 'No data found for this id',
      });
    }
    return res.send({
      success: true,
      message: 'Item retrieved successfully',
      //   nft: nft.length ? nft[0] : null ,
      data: nftDetail,
      NFTDetail: tokenData,
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
      explore,
      gtePrice,
      ltePrice,
      categoryId,
      oldest,
      lowToHigh,
      newest,
      highToLow,
    } = req.query;

    // console.log(req.query, 'query');
    // console.log(limit, 'limit in start');
    // console.log(page, 'page');

    // console.log(gtePrice, 'gtePrice');
    const userId = req.user;
    let filter = {
      status: { $ne: 0 },
      ...(gtePrice && {
        currentPrice: { $gte: Number(gtePrice), $lte: Number(ltePrice) },
      }),
      ...(collectionId && { collectionId }),
      ...(categoryId && { categoryId }),
    };
    // get NFTs for given collection
    if (collectionId) filter.collectionId = ObjectId(collectionId);

    // COMMENTED TEMP.
    // explore exclusive assets
    // if (explore) {
    //     filter = {
    //         $or: [
    //             { creatorId: ObjectId(userId) },
    //             {
    //                 $or: [
    //                     { sellingMethod: 1 },
    //                     { sellingMethod: 2 }
    //                 ],
    //                 auctionStartDate: { $lt: new Date(moment().add(1, 'days').format('YYYY/MM/DD')) },
    //                 auctionEndDate: { $gte: new Date(moment().format('YYYY/MM/DD')) }
    //             }
    //         ]
    //     }
    // }

    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;
    //console.log(limit, 'limti testing');

    const total = await NFT.countDocuments(filter);

    const nfts = await NFT.aggregate([
      { $match: filter },
      {
        $sort: {
          ...(newest && { createdAt: 1 }),
          ...(oldest && { createdAt: -1 }),
          ...(lowToHigh && { currentPrice: 1 }),
          ...(highToLow && { currentPrice: -1 }),
          name: 1,
        },
      },
      { $skip: limit * (page - 1) },
      { $limit: limit },
      // {
      //     $lookup: {
      //         from: 'users',
      //         foreignField: '_id',
      //         localField: 'ownerId',
      //         as: 'owner'
      //     }
      // },
      // {
      //     $unwind: '$owner'
      // },
      // {
      //     $project: {
      //         name: 1, image: 1, sold: 1, copies: 1, currentPrice: 1,collectionId:1,currentPrice:1,description:1,royalty:1,size:1,userId,
      //         owner: {
      //             _id: '$owner._id',
      //             username: '$owner.username',
      //             profilePhoto: { $ifNull: ['$owner.profilePhoto', userDefaultImage] }
      //         }
      //     }
      // }
    ]);
    for (const nft of nfts) {
      const findCount = await Likes.findOne().where('nftId', nft._id);
      nft.likeCount = 0;
      if (findCount) {
        nft.likeCount = findCount.count;
      }
    }

    return res.send({
      success: true,
      message: 'NFTs fetched successfully',
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
    console.log(req.body.currentUserId, 'req.body.currentUserId');
    console.log(req.body.ownerId, 'req.body.ownerId');
    let update = {
      nftOwnerId: req.body.currentUserId,
    };
    const updatedNft = await NFT.findOneAndUpdate(filter, update, {
      new: true,
    });
    res.status(200).send({
      status: 'success',
      data: updatedNft,
    });
  } catch (err) {
    //  console.log(err,"error of ownerShip===>")
    // res.status(400).send({
    //     status:"failure",
    //     err
    // })
    return next(error);
  }
};

exports.updateNft = async (req, res, next) => {
  try {
    let payload = {
      nftId: req.body.nftId,
      name: req.body.name,
      description: req.body.description,
      attributes: req.body.attributes,
      levels: req.body.levels,
      userId: req.body.userId,
      ownerAddress: req.body.ownerAddress,
      collectionId: req.body.collectionId,
      currentPrice: req.body.currentPrice,
      copies: req.body.copies,
    };
    const { error } = validation.validateEditNftSchema(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    if (req.files && req.files.image) {
      const image = req.files.image[0];
      const imgData = fs.readFileSync(image.path);
      payload.image = await addImage(imgData);
    }

    if (!payload.image) {
      return res.send({
        status: false,
        message: 'image field is required',
      });
    }
    const ownerId = payload.userId;
    payload.metaData = await addContent({
      name: payload.name,
      description: payload.description,
      image: payload.image,
      //   properties: {
      //     size: newPayload.size || '',
      //   },
      properties: payload.attributes,
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
    console.log(collectionId, 'collectionId');
    const NFTs = await NFT.aggregate([
      {
        $match: { collectionId: ObjectId(collectionId) },
      },
    ]);
    console.log(NFTs, 'nfts');
    res.status(200).send({ success: true, data: NFTs });
  } catch (err) {
    res.status(200).send({ success: false, error: err });
  }
};

// API to delete collection
exports.delete = async (req, res, next) => {
  try {
    const { nftId } = req.params;
    if (nftId) {
      const nft = await NFT.deleteOne({ _id: nftId });
      if (nft.deletedCount) {
        const nftToken = await NftTokens.deleteOne({ nftId: nftId });
        if (nftToken) {
          return res.send({
            status: true,
            message: 'NFT deleted successfully',
          });
        }
      }
      return res.status(400).send({
        status: false,
        message: 'NFT not found for given Id',
      });
    } else
      return res
        .status(400)
        .send({ status: false, message: 'NFT Id is required' });
  } catch (error) {
    return next(error);
  }
};

// API to get user NFTs listing
exports.myNftListing = async (req, res, next) => {
  try {
    let { userId, page, limit } = req.query;

    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    if (!userId)
      return res
        .status(400)
        .send({ status: false, message: 'Please Sign In First' });

    const myNfts = await NFT.find({})
      .where('userId', userId)
      .populate('collectionId', 'name');

    if (myNfts.length == 0) {
      return res.status(400).send({
        status: false,
        message: 'No NFT Found',
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
      message: 'My NFTs fetched successfully',
      data,
    });
  } catch (error) {
    return next(error);
  }
};
