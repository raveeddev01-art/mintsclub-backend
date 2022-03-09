const fs = require('fs');
const moment = require('moment');
const Bid = require('../../models/bids.model');
const Nft = require('../../models/nfts.model');
const ObjectId = require('mongoose').Types.ObjectId;
const { globalImgPlaceholder } = require('../../../config/vars');
const validation = require('../../middlewares/front/bidValidation');
const nftValidation = require('../../middlewares/front/nftValidation');

// API to create bid validateNftId
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
    if (bid) {
      let newPayload = {
        highestBid: payload.bidAmount,
      };

      const nftUpdate = await Nft.findByIdAndUpdate(
        { _id: payload.nftId },
        { $set: payload }
      );
    }
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
    let { page, limit } = req.query;

    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    allBids = await Bid.find();

    let data = {};

    data.totalRecords = allBids.length;

    if (endIndex < allBids.length) {
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

    data.Bids = allBids.slice(startIndex, endIndex);

    return res.status(200).send({
      success: true,
      message: 'Bids fetched successfully',
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// API to get bids list by NFT Id
exports.claimableBidListbyNftId = async (req, res, next) => {
  try {
    let { nftId, page, limit } = req.query;

    if (!nftId)
      return res
        .status(400)
        .send({ status: false, message: 'Please enter nftId' });

    let payload = {
      nftId: nftId,
    };

    const { error } = nftValidation.validateNftId(payload);

    if (error) {
      let errorMsg = error.details[0].message;
      return res.status(400).send({ status: false, data: errorMsg });
    }
    page = page !== undefined && page !== '' ? parseInt(page) : 1;
    limit = limit !== undefined && limit !== '' ? parseInt(limit) : 10;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    bidsByNftId = await Bid.find({ nftId: payload.nftId });

    let data = {};

    data.totalRecords = bidsByNftId.length;

    if (endIndex < bidsByNftId.length) {
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

    data.Bids = bidsByNftId.slice(startIndex, endIndex);

    return res.status(200).send({
      status: true,
      message: 'Bids by NFT Id fetched successfully',
      data,
    });
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
