const Joi = require('@hapi/joi');

const validateCollectionSchema = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    categoryId: Joi.string().allow(''),
    name: Joi.string().required(),
    url: Joi.string().allow(''),
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
    categoryId: Joi.string().allow(''),
    name: Joi.string().required(),
    url: Joi.string().allow(''),
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

module.exports = {
  validateCollectionSchema,
  validateEditCollectionSchema,
};
