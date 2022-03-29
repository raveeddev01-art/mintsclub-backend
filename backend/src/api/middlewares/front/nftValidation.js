const Joi = require('@hapi/joi').extend(require('@joi/date'));
// const Joi = require('joi')
// .extend(require('@joi/date'));
const validateNFTSchema = (data) => {
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    creatorId: Joi.string().allow(''),
    attributes: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.string().allow(''),
    }),
    levels: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.number().allow(''),
      total: Joi.number().allow(''),
    }),
    royalty: Joi.string().allow(''),
    fileType: Joi.string().valid('image', 'audio', 'video').required(),
    ownerId: Joi.string().required(),
    //nftOwnerId: { type: String },
    userId: Joi.string().required(),
    categoryId: Joi.string().allow(''),
    collectionId: Joi.string().required(),
    ownerAddress: Joi.string().allow(''),
    // txHash: Joi.string().allow(''),
    //image: { type: String },
    royalty: Joi.string().allow(''),
    //size: { type: String },
    copies: Joi.number().required(),
    status: Joi.number().empty('').allow(null), // 1 = Put on Sale, 2 = Instant Sale Price, 3 = Unlock Purchased
    sold: Joi.number().empty('').allow(null),
    sellingMethod: Joi.number().empty('').allow(null), // 1 = Fixed Price, 2 = Timed Auction
    //sellingConfig: { type: Object },
    auctionStartDate: Joi.string().allow(''),
    auctionEndDate: Joi.string().allow(''),
    auctionStartTime: Joi.string().allow(''),
    auctionEndTime: Joi.string().allow(''),
    //metaData: { type: String }, // ipfs link
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(data, options);
};
const validateEditNftSchema = (data) => {
  const schema = Joi.object().keys({
    nftId: Joi.string().required(),
    userId: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    fileType: Joi.string().valid('image', 'audio', 'video').required(),
    attributes: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.string().allow(''),
    }),
    levels: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.number().allow(''),
      total: Joi.number().allow(''),
    }),
    royalty: Joi.string().allow(''),
    collectionId: Joi.string().required(),
    currentPrice: Joi.number().required(),
    ownerAddress: Joi.string().allow(''),
    copies: Joi.number().required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(data, options);
};

const validateNFTimedTAuctionSchema = (data) => {
  const schema = Joi.object().keys({
    _id: Joi.string().required(),
    auctionStartDate: Joi.date().allow(''),
    auctionEndDate: Joi.date().allow(''),
    copiesForAuction: Joi.number().required(),
    // auctionStartTime: Joi.string().allow(''),
    // auctionEndTime: Joi.string().allow(''),
    sellingMethod: Joi.number().required(),
    sellingConfig: Joi.object()
      .keys({
        // method: Joi.number().allow(''),
        startPrice: Joi.object()
          .keys({
            currency: Joi.string().required(),
            amount: Joi.number().required(),
          })
          .required(),
        duration: Joi.object()
          .keys({
            startDate: Joi.date().required(),
            endDate: Joi.date().required(),
            // startTime: Joi.string().allow(''),
            // endTime: Joi.string().allow(''),
          })
          .required(),
        reservePrice: Joi.object().keys({
          currency: Joi.string().allow(''),
          amount: Joi.number().allow(''),
        }),
      })
      .required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(data, options);
};
const validateNFFixedTAuctionSchema = (data) => {
  const schema = Joi.object().keys({
    _id: Joi.string().required(),
    copiesForAuction: Joi.number().required(),
    sellingMethod: Joi.number().required(),
    sellingConfig: Joi.object()
      .keys({
        // method: Joi.number().allow(''),
        // listingSchedule: Joi.object()
        //   .keys({
        //     startDate: Joi.string().required(),
        //     endDate: Joi.string().required(),
        //     // startTime: Joi.string().allow(''),
        //     // endTime: Joi.string().allow(''),
        //   })
        //   .required(),
        price: Joi.object()
          .keys({
            currency: Joi.string().required(),
            amount: Joi.number().required(),
          })
          .required(),
        reserveFor: Joi.string().allow(''),
      })
      .required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(data, options);
};

const validateBuyNowSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().alphanum().min(12).max(24).required(),
    nftId: Joi.string().alphanum().min(12).max(24).required(),
    ownerAddress: Joi.string().required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(data, options);
};

const validateNftId = (nftId) => {
  const schema = Joi.object().keys({
    nftId: Joi.string().alphanum().min(12).max(24).required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(nftId, options);
};

module.exports = {
  validateNFTSchema,
  validateEditNftSchema,
  validateNFTimedTAuctionSchema,
  validateNFFixedTAuctionSchema,
  validateNftId,
  validateBuyNowSchema,
};
