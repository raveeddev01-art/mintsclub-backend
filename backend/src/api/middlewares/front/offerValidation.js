const Joi = require('@hapi/joi').extend(require('@joi/date'));


const validateOfferSchema = (data) => {
    const schema = Joi.object().keys({
        fromAddress: Joi.string().required(),
        toAddress: Joi.string().required(),
        offerBy: Joi.string().alphanum().min(12).max(24).required(),
        ownerId:Joi.string().alphanum().min(12).max(24).required(),
        nftId:Joi.string().required(),
        price:Joi.number().required(),
        isAccepted:Joi.boolean().required(),
        isExpired:Joi.boolean().required(),
        expiryDate:Joi.date().allow(null)
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


  module.exports={
    validateOfferSchema
  }