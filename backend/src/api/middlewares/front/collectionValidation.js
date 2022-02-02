const Joi = require('@hapi/joi');
// const BaseJoi = require('joi');
//const ImageExtension = require('joi-image-extension');

//const JoiVal = Joi.extend(ImageExtension);

const validateCollectionSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    categoryId: Joi.string().allow(''),
    name: Joi.string().required(),
    url: Joi.string().allow(''),
    logo: Joi.allow(''),
    featuredImg: Joi.allow(''),
    banner: Joi.allow(''),
    description: Joi.string().allow(''),
    category: Joi.string().allow(''),
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
const validateEditCollectionSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    _id: Joi.string().required(),
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
  validateCollectionSchema,
  validateEditCollectionSchema,
};
