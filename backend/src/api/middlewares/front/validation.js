const Joi = require('@hapi/joi');

const validateContractSchema = (contract) => {
  const schema = Joi.object().keys({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(600).allow(''),
    symbol: Joi.string().max(50).allow(''),
    externalLink: Joi.string().allow(''),
    attributes: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.string().allow(''),
    }),
    levels: Joi.array().items({
      name: Joi.string().allow(''),
      value: Joi.number().allow(''),
      total: Joi.number().allow(''),
    }),
    email: Joi.string()
      .strict()
      .trim()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
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
  return schema.validate(contract, options);
};

const validateSignUpSchema = (data) => {
  const schema = Joi.object().keys({
    address: Joi.string().max(600).required(),
    email: Joi.string()
      .strict()
      .trim()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
      })
      .required(),
    username: Joi.string().max(50).required(),
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

const validateEmail = (email) => {
  const schema = Joi.object().keys({
    email: Joi.string()
      .strict()
      .trim()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
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
  return schema.validate(email, options);
};

module.exports = {
  validateContractSchema,
  validateEmail,
  validateSignUpSchema,
};
