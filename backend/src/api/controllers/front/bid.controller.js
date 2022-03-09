const fs = require('fs');
const moment = require('moment');
const Bid = require('../../models/bids.model');
const Nft = require('../../models/nfts.model');
const ObjectId = require('mongoose').Types.ObjectId;
const { globalImgPlaceholder } = require('../../../config/vars');
const validation = require('../../middlewares/front/bidValidation');

// API to create bid
exports.create = async (req, res, next) => {
  try {
    let payload = {
      bidBy: req.body.bidBy,
      ownerId: req.body.ownerId,
      nftId: req.body.nftId,
      bidAmount: req.body.bidAmount,
      isAccepted: req.body.isAccepted,
      expiryDate: req.body.expiryDate,
      fromAddress: req.body.fromAddress,
      toAddress: req.body.toAddress,
    };

    const { error } = validation.validateCreateBid(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    const bid = await Bid.create(payload);
    return res.send({
      success: true,
      message: 'You have placed bid successfully',
      bid,
    });
  } catch (error) {
    return next(error);
  }
};

// API to delete bid
exports.delete = async (req, res, next) => {
  try {
    const { bidId } = req.params;
    let payload = {
      bidId: bidId,
    };
    const { error } = validation.validateBidId(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }

    const bid = await Bid.deleteOne({ _id: payload.bidId });

    if (bid && bid.deletedCount === 1)
      return res.send({
        success: true,
        message: 'Your bid has been cancelled successfully',
      });
    else
      return res
        .status(400)
        .send({ success: false, message: 'Bid not found for given Id' });
  } catch (error) {
    return next(error);
  }
};

// API to get claimed bids by bidId
exports.claimedBid = async (req, res, next) => {
  try {
    const { bidId } = req.query;

    const bid = await Bid.findByIdAndUpdate(
      { _id: bidId },
      { isClaimable: false, isclaimed: true }
    );

    return res.status(200).send({
      success: true,
      message: 'Bid claimed successfully',
      data: {},
    });
  } catch (error) {
    // console.log(error,"error==>")
    return next(error);
  }
};
// API to get claimable bids list by userid
exports.claimableListbyUserId = async (req, res, next) => {
  try {
    const { userId } = req.query;
    console.log('userId', userId);
    let allBids = await Bid.find({ bidBy: userId, isClaimable: true });
    // let allBids = await Bid.find({bidBy: userId, isClaimable: false});
    return res.status(200).send({
      success: true,
      message: 'Bids fetched successfully',
      data: {
        allBids,
        // pagination: {
        //     page, limit, total,
        //     pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit)
        // },
        // highestBidAmt: highestBid.length ? highestBid[0].price.amount : null
      },
    });
  } catch (error) {
    // console.log(error,"error==>")
    return next(error);
  }
};

// API to get bids list
exports.list = async (req, res, next) => {
  try {
    // let { page, limit, nftId } = req.query
    // let filter = { isExpired: false, isAccepted: false }

    // if (nftId)
    //     filter.nftId = ObjectId(nftId)

    // page = page !== undefined && page !== '' ? parseInt(page) : 1
    // limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10

    // const total = await Bid.countDocuments(filter)
    //let allBids = await Bid.find();
    //  allBids=JSON.stringify(allBids)
    // console.log(allBids, 'gettin gdata');
    //  allBids=allBids.toJSON()
    //  console.log(,"allBids==>")
    // const bids = await Bid.aggregate([
    //     { $match: filter },
    //     { $sort: { createdAt: -1 } },
    //     { $skip: limit * (page - 1) },
    //     { $limit: limit },
    //     {
    //         $lookup: {
    //             from: 'users',
    //             foreignField: '_id',
    //             localField: 'bidBy',
    //             as: 'bidBy'
    //         }
    //     },
    //     // {
    //     //     $unwind: '$bidBy'
    //     // },
    //     {
    //         $project: {
    //             // bidBy: {
    //             //     _id: '$bidBy._id',
    //             //     // username: '$bidBy.username',
    //             //     // profilePhoto: { $ifNull: ['$bidBy.profilePhoto', globalImgPlaceholder] }
    //             // },
    //             price: 1, expiryDate: 1, createdAt: 1
    //         }
    //     }
    // ])

    // console.log(bids,"foundBids==>")
    // const highestBid = await Bid.find({ nftId }, 'price').sort('-price.amount').limit(1)

    // return res.status(200).send({
    //   success: true,
    //   message: 'Bids fetched successfully',
    //   data: {
    //     allBids,
    // pagination: {
    //     page, limit, total,
    //     pages: Math.ceil(total / limit) <= 0 ? 1 : Math.ceil(total / limit)
    // },
    //   },
    // });

    try {
      let { page, limit } = req.query;

      let total = 0;

      page = page !== undefined && page !== '' ? parseInt(page) : 1;
      limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

      total = await Bid.countDocuments({});

      if (page > Math.ceil(total / limit) && total > 0)
        page = Math.ceil(total / limit);

      allBids = await Bid.find();

      const totalRecords = allBids.length;

      // allBids.push({ $skip: limit * (page - 1) });
      // allBids.push({ $limit: limit });

      return res.send({
        success: true,
        message: 'Bids fetched successfully',
        data: {
          bids: allBids,

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
  } catch (error) {
    return next(error);
  }
};

// API to accept bid
exports.accept = async (req, res, next) => {
  try {
    console.log('acept', req.body);

    // const { bidId } = req.params
    const { bidId } = req.body;

    if (bidId) {
      // accept bid
      const bid = await Bid.findByIdAndUpdate(
        { _id: bidId },
        { isAccepted: true },
        { new: true }
      );
      console.log('acceptenace for ', bid);
      if (bid) {
        // expire other bids
        console.log('bids for single bid', bid);
        await Bid.updateMany(
          { _id: { $ne: ObjectId(bidId) }, nftId: bid.nftId },
          { $set: { isClaimable: true, isExpired: true } }
        );
        console.log('compiled');
        console.log('bid object', bid.nftId);
        const nft = await Nft.findById({ _id: bid.nftId });

        // console.log('sold', nft)
        await Nft.updateOne(
          { _id: bid.nftId },
          {
            $unset: {
              sellingMethod: undefined,
              sellingConfig: undefined,
              auctionEndDate: undefined,
              auctionEndTime: undefined,
              auctionStartDate: undefined,
              auctionStartTime: undefined,
            },
            $set: {
              ownerId: bid.bidBy,
              nftOwnerId: bid.bidBy,
              // sold:nft.sold +1
            },
          }
        );

        return res.send({
          success: true,
          message: 'Bid has been accepted successfully',
        });
      } else
        return res
          .status(400)
          .send({ success: false, message: 'Bid not found for given Id' });
    } else
      return res
        .status(400)
        .send({ success: false, message: 'Bid Id is required' });
  } catch (error) {
    return next(error);
  }
};
