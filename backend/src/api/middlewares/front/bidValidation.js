const Joi = require('@hapi/joi').extend(require('@joi/date'));

const validateCreateBid = (data) => {
  const schema = Joi.object().keys({
    bidBy: Joi.string().alphanum().min(12).max(24).required(),
    ownerId: Joi.string().alphanum().min(12).max(24).required(),
    nftId: Joi.string().alphanum().min(12).max(24).required(),
    bidAmount: Joi.number().required(),
    isAccepted: Joi.boolean().default(false),
    expiryDate: Joi.date().allow(''),
    fromAddress: Joi.string().max(300).required(),
    toAddress: Joi.string().max(300).required(),
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

const validateBidId = (bidId) => {
  const schema = Joi.object().keys({
    bidId: Joi.string().alphanum().min(12).max(24).required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(bidId, options);
};

module.exports = {
  validateCreateBid,
  validateBidId,
};
