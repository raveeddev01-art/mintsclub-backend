const Joi = require('@hapi/joi');

const validateCollectionSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().alphanum().min(12).max(24).required(),
    categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
    name: Joi.string().min(1).max(100).required(),
    url: Joi.string().allow(''),
    description: Joi.string().min(4).max(150).allow(''),
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
const validateEditCollectionSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().alphanum().min(12).max(24).required(),
    _id: Joi.string().alphanum().min(12).max(24).required(),
    categoryId: Joi.string().alphanum().min(12).max(24).allow(''),
    name: Joi.string().min(1).max(100).required(),
    url: Joi.string().allow(''),
    description: Joi.string().min(1).max(150).allow(''),
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

module.exports = {
  validateCollectionSchema,
  validateEditCollectionSchema,
};
