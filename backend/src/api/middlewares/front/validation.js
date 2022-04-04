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
    //Joi.string().regex(/^0x[a-fA-F0-9]{40}$/)
    address: Joi.string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .required(),
    email: Joi.string()
      .strict()
      .trim()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ['com', 'net'] },
      })
      .required(),
    username: Joi.string().min(3).max(40).required(),
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
const validateAddress = (address) => {
  const schema = Joi.object().keys({
    address: Joi.string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(address, options);
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
const validateUser = (user) => {
  const schema = Joi.object().keys({
    userId: Joi.string().alphanum().min(12).max(24).required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(user, options);
};

const validateUserProfile = (data) => {
  const schema = Joi.object().keys({
    userId: Joi.string().alphanum().min(12).max(24).required(),
    bio: Joi.string().max(300).allow(''),
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

const validateId = (id) => {
  const schema = Joi.object().keys({
    id: Joi.string().alphanum().min(12).max(24).required(),
  });
  const options = {
    errors: {
      wrap: {
        label: '',
      },
    },
  };
  return schema.validate(id, options);
};
module.exports = {
  validateContractSchema,
  validateEmail,
  validateSignUpSchema,
  validateAddress,
  validateUser,
  validateUserProfile,
  validateId,
};
