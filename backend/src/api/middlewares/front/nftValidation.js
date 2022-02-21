const Joi = require('@hapi/joi');

const validateNFTSchema = (data) => {
  const schema = Joi.object().keys({
    name: Joi.string().allow(''),
    description: Joi.string().required(),
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    collectionId: Joi.string().required(),
    currentPrice: Joi.number().required(),
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

module.exports = {
  validateNFTSchema,
  validateEditNftSchema,
};
