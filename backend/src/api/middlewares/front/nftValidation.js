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
    ownerId: Joi.string().required(),
    //nftOwnerId: { type: String },
    userId: Joi.string().required(),
    categoryId: Joi.string().allow(''),
    collectionId: Joi.string().required(),
    currentPrice: Joi.number().allow(''),
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

    // userId: Joi.string().required(),
    // categoryId: Joi.string().allow(''),
    // name: Joi.string().required(),
    // url: Joi.string().allow(''),
    // description: Joi.string().allow(''),
    // category: Joi.string().allow(''),
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
    attributes: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.string().allow(''),
    }),
    levels: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.number().allow(''),
      total: Joi.number().allow(''),
    }),
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

const validateNFTTimedAuctionSchema = (data) => {
  const schema = Joi.object().keys({
    _id: Joi.string().required(),
    auctionStartDate: Joi.date().iso().required(),
    auctionEndDate: Joi.date().iso().required(),
    auctionStartTime: Joi.string().required(),
    auctionEndTime: Joi.string().required(),
    sellingConfig: Joi.object().keys({
      method: Joi.number().allow(''),
      startPrice: Joi.object().keys({
        currency: Joi.string().required(),
        amount: Joi.number().required(),
      }),
      duration: Joi.object().keys({
        startDate: Joi.string().allow(''),
        endDate: Joi.string().allow(''),
        startTime: Joi.string().allow(''),
        endTime: Joi.string().allow(''),
      }),
      reservePrice: Joi.object().keys({
        currency: Joi.string().allow(),
        amount: Joi.number().allow(),
      }),
    }),
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

module.exports = {
  validateNFTSchema,
  validateEditNftSchema,
  validateNFTTimedAuctionSchema,
};
